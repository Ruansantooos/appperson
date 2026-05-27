// Webhook do Stripe — ativa/atualiza o plano automaticamente após o pagamento.
//
// Roda com a SERVICE_ROLE key (única autorizada a alterar `plan`, travado no RLS).
//
// Mapeia o pagamento -> usuário por DUAS estratégias (nesta ordem):
//   1. session.client_reference_id  (quando o checkout é criado pela função
//      create-checkout-session, que passa o user.id)
//   2. e-mail do cliente            (quando o checkout vem de um Payment Link
//      buy.stripe.com com prefilled_email — caso atual do frontend)
//
// Eventos:
//   checkout.session.completed     -> ativa o plano (assinatura ou compra avulsa)
//   invoice.paid                   -> renova a validade
//   customer.subscription.updated  -> reflete mudança/cancelamento
//   customer.subscription.deleted  -> volta para 'free'
//
// Secrets (Supabase > Edge Functions > Secrets):
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_INDIVIDUAL_PRICE_ID, STRIPE_CASAL_PRICE_ID
//   (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente)

import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno&deno-std=0.177.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const PRICE_INDIVIDUAL = Deno.env.get('STRIPE_INDIVIDUAL_PRICE_ID');
const PRICE_CASAL = Deno.env.get('STRIPE_CASAL_PRICE_ID');

type Plan = 'free' | 'individual' | 'casal';

function planForPrice(priceId?: string | null): Plan | null {
  if (!priceId) return null;
  if (priceId === PRICE_CASAL) return 'casal';
  if (priceId === PRICE_INDIVIDUAL) return 'individual';
  return null;
}

const iso = (unixSeconds: number) => new Date(unixSeconds * 1000).toISOString();

/** Atualiza o perfil por id, por stripe_customer_id ou por e-mail (na ordem do que existir). */
async function updateProfile(
  match: { userId?: string | null; customerId?: string | null; email?: string | null },
  fields: Record<string, unknown>,
) {
  let q = supabase.from('profiles').update(fields);
  if (match.userId) q = q.eq('id', match.userId);
  else if (match.customerId) q = q.eq('stripe_customer_id', match.customerId);
  else if (match.email) q = q.ilike('email', match.email);
  else {
    console.warn('Sem chave para mapear o usuário', fields);
    return;
  }
  const { error } = await q;
  if (error) console.error('update profiles falhou:', error.message);
}

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    console.error('Assinatura inválida:', (err as Error).message);
    return new Response((err as Error).message, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const email = session.customer_details?.email ?? session.customer_email;
        const customerId = (session.customer as string) ?? null;

        let priceId: string | null | undefined;
        let expiresAt: string;
        let subscriptionId: string | null = null;

        if (session.mode === 'subscription' && session.subscription) {
          subscriptionId = session.subscription as string;
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          priceId = sub.items.data[0]?.price?.id;
          expiresAt = iso(sub.current_period_end);
        } else {
          const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
          priceId = items.data[0]?.price?.id;
          expiresAt = new Date(Date.now() + 365 * 86_400_000).toISOString();
        }

        const plan = planForPrice(priceId);
        if (!plan) {
          console.warn('Price não reconhecido (confira STRIPE_PRO/ELITE_PRICE_ID):', priceId);
          break;
        }
        await updateProfile(
          { userId, customerId, email },
          {
            plan,
            plan_expires_at: expiresAt,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          },
        );
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string | null;
        const customerId = invoice.customer as string;
        const email = invoice.customer_email;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const plan = planForPrice(sub.items.data[0]?.price?.id);
          if (plan) {
            await updateProfile(
              { customerId, email },
              { plan, plan_expires_at: iso(sub.current_period_end), stripe_subscription_id: subId },
            );
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const active = sub.status === 'active' || sub.status === 'trialing';
        const plan = active ? planForPrice(sub.items.data[0]?.price?.id) ?? 'pro' : 'free';
        await updateProfile(
          { customerId: sub.customer as string },
          { plan, plan_expires_at: active ? iso(sub.current_period_end) : null },
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await updateProfile(
          { customerId: sub.customer as string },
          { plan: 'free', plan_expires_at: null, stripe_subscription_id: null },
        );
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Erro ao processar evento:', (err as Error).message);
    return new Response('handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
