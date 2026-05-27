// Webhook (postback) da TICTO — ativa/atualiza o plano após o pagamento.
//
// Roda com a SERVICE_ROLE key (única autorizada a alterar `plan`, travado no RLS).
// Mapeia o pagamento -> usuário pelo E-MAIL do cliente (Ticto sempre envia).
// Mapeia o produto -> plano via os IDs configurados nos secrets.
//
// Segurança: a Ticto envia um campo `token` no corpo do postback. Comparamos com
// o secret TICTO_TOKEN. Se não bater, recusamos (401).
//
// Secrets (Supabase > Edge Functions > Secrets) — defina PELO MENOS um par por plano:
//   TICTO_TOKEN                   (token do postback, configurado no painel da Ticto)
//   TICTO_INDIVIDUAL_PRODUCT_ID   e/ou  TICTO_INDIVIDUAL_OFFER_CODE  (ex: O9CD45FC9)
//   TICTO_CASAL_PRODUCT_ID        e/ou  TICTO_CASAL_OFFER_CODE
//   (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente)
//
// Doc do payload v2: https://webhook.ticto.dev/docs/v2

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

type Plan = 'free' | 'individual' | 'casal';

const PRODUCT_INDIVIDUAL = Deno.env.get('TICTO_INDIVIDUAL_PRODUCT_ID') ?? '';
const PRODUCT_CASAL = Deno.env.get('TICTO_CASAL_PRODUCT_ID') ?? '';
const OFFER_INDIVIDUAL = Deno.env.get('TICTO_INDIVIDUAL_OFFER_CODE') ?? '';
const OFFER_CASAL = Deno.env.get('TICTO_CASAL_OFFER_CODE') ?? '';

// Provisionamento de conta + e-mail de acesso (Resend).
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://corelys.online';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Corelys <acesso@corelys.online>';

// Mapeia produto/oferta -> plano, casando por product_id OU por offer_code.
function planFor(productId: unknown, offerCode: unknown): Plan | null {
  const pid = productId == null ? '' : String(productId);
  const oc = offerCode == null ? '' : String(offerCode);
  if ((PRODUCT_CASAL && pid === PRODUCT_CASAL) || (OFFER_CASAL && oc === OFFER_CASAL)) return 'casal';
  if ((PRODUCT_INDIVIDUAL && pid === PRODUCT_INDIVIDUAL) || (OFFER_INDIVIDUAL && oc === OFFER_INDIVIDUAL)) return 'individual';
  return null;
}

// Status que CONCEDEM acesso (compra paga, assinatura ativa/renovada, trial).
const GRANT = new Set([
  'authorized', 'all_charges_paid', 'extended', 'uncanceled', 'trial', 'trial_started',
]);
// Status que REVOGAM acesso imediatamente (dinheiro devolvido ou assinatura encerrada).
const REVOKE = new Set([
  'refunded', 'chargeback', 'close', 'trial_ended',
]);
// 'subscription_canceled'/'subscription_delayed' NÃO revogam na hora: o acesso
// segue até o fim do período pago (plan_expires_at). A app deve tratar
// plan_expires_at < agora como 'free'.

// next_charge vem como "YYYY-MM-DD HH:MM:SS". Converte para ISO.
function parseTictoDate(s?: string): string | null {
  if (!s) return null;
  const d = new Date(s.replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

async function updateByEmail(email: string, fields: Record<string, unknown>) {
  const { error } = await supabase.from('profiles').update(fields).ilike('email', email);
  if (error) console.error('update profiles falhou:', error.message);
}

// Senha aleatória legível (a pessoa pode usar essa OU definir a sua pelo magic link).
function genPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

// Envia o e-mail de acesso via Resend (login + senha + magic link p/ trocar a senha).
async function sendAccessEmail(email: string, password: string, magicLink: string, name?: string) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY ausente — e-mail de acesso NÃO enviado para', email);
    return;
  }
  const ola = name ? `Olá, ${name}!` : 'Olá!';
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="color:#111">${ola} Bem-vindo(a) ao Corelys 🎉</h2>
      <p>Sua conta foi criada. Use os dados abaixo para entrar:</p>
      <div style="background:#f4f4f5;border-radius:12px;padding:16px 20px;margin:16px 0">
        <p style="margin:0 0 6px"><strong>Login:</strong> ${email}</p>
        <p style="margin:0"><strong>Senha provisória:</strong> ${password}</p>
      </div>
      <p>Recomendamos definir a sua própria senha agora:</p>
      <p style="margin:20px 0">
        <a href="${magicLink}" style="background:#c1ff72;color:#000;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;display:inline-block">
          Definir minha senha
        </a>
      </p>
      <p style="font-size:12px;color:#666">Se o botão não funcionar, copie e cole este link no navegador:<br>${magicLink}</p>
      <p style="font-size:12px;color:#666">Você também pode entrar direto em ${SITE_URL} com o login e a senha provisória acima.</p>
    </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: RESEND_FROM, to: email, subject: 'Seu acesso ao Corelys', html }),
  });
  if (!res.ok) console.error('Resend falhou:', res.status, await res.text());
}

// Cria o usuário (se ainda não existir), grava o perfil com o plano e manda o e-mail.
async function provisionAccount(email: string, name: string | undefined, plan: Plan, expires: string) {
  const password = genPassword();
  const { data: created, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: name ? { full_name: name } : undefined,
  });

  if (error || !created?.user) {
    // Provavelmente já existe no Auth — só garante o plano pelo e-mail.
    console.warn('createUser falhou (talvez já exista):', error?.message);
    await updateByEmail(email, { plan, plan_expires_at: expires });
    return;
  }

  const uid = created.user.id;
  await supabase.from('profiles').upsert({
    id: uid, email, full_name: name ?? null, plan, plan_expires_at: expires,
    updated_at: new Date().toISOString(),
  });

  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'recovery', email, options: { redirectTo: SITE_URL },
  });
  const magicLink = (linkData as any)?.properties?.action_link ?? `${SITE_URL}/#/login`;
  if (linkErr) console.error('generateLink falhou:', linkErr.message);

  await sendAccessEmail(email, password, magicLink, name);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  // 1) Valida o token do postback.
  const expected = Deno.env.get('TICTO_TOKEN');
  if (!expected || payload?.token !== expected) {
    console.warn('Token inválido no postback Ticto');
    return new Response('unauthorized', { status: 401 });
  }

  try {
    const status: string = payload.status ?? '';
    const email: string | undefined = payload?.customer?.email;
    // `item` pode vir como objeto ou array — normaliza para o primeiro.
    const item = Array.isArray(payload.item) ? payload.item[0] : payload.item;
    const plan = planFor(item?.product_id ?? item?.offer_id, item?.offer_code);
    const sub = Array.isArray(payload.subscriptions) ? payload.subscriptions[0] : payload.subscriptions;

    if (!email) {
      console.warn('Postback sem customer.email — ignorado. status=', status);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    if (GRANT.has(status)) {
      if (!plan) {
        console.warn('Produto/oferta não reconhecido (confira os secrets):', { product_id: item?.product_id, offer_code: item?.offer_code });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }
      const expires = parseTictoDate(sub?.next_charge)
        ?? new Date(Date.now() + 365 * 86_400_000).toISOString();
      // Já existe perfil com esse e-mail? Renovação/upgrade -> só atualiza o plano.
      // Senão, é cliente novo -> provisiona a conta e dispara o e-mail de acesso.
      const { data: existing } = await supabase.from('profiles')
        .select('id').ilike('email', email).maybeSingle();
      if (existing?.id) {
        await supabase.from('profiles').update({ plan, plan_expires_at: expires }).eq('id', existing.id);
      } else {
        await provisionAccount(email, payload?.customer?.name, plan, expires);
      }
    } else if (REVOKE.has(status)) {
      await updateByEmail(email, { plan: 'free', plan_expires_at: null });
    } else if (status === 'subscription_canceled' || status === 'subscription_delayed') {
      // Não revoga agora: mantém o plano até o fim do período. Só ajusta a validade
      // se a Ticto informar a próxima cobrança (fim do ciclo pago).
      const expires = parseTictoDate(sub?.next_charge);
      if (expires) await updateByEmail(email, { plan_expires_at: expires });
    }
    // Demais status (waiting_payment, pix_created, refused, abandoned_cart, ...) -> ignora.

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Erro ao processar postback Ticto:', (err as Error).message);
    return new Response('handler error', { status: 500 });
  }
});
