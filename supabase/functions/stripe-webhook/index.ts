import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PRICE_TO_PLAN: Record<string, string> = {
  [Deno.env.get('STRIPE_PRO_PRICE_ID') || '']: 'pro',
  [Deno.env.get('STRIPE_ELITE_PRICE_ID') || '']: 'elite',
};

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription as string;

        if (!userId) break;

        // Get subscription to find the price and period end
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id || '';
        const plan = PRICE_TO_PLAN[priceId] || 'pro';
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        await supabase
          .from('profiles')
          .update({
            plan,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            plan_expires_at: periodEnd,
          })
          .eq('id', userId);

        console.log(`User ${userId} subscribed to ${plan}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id || '';
        const plan = PRICE_TO_PLAN[priceId] || 'pro';
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const updateData: Record<string, any> = {
            plan_expires_at: periodEnd,
          };

          // Update plan if subscription is active or trialing
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            updateData.plan = plan;
          } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            updateData.plan = 'free';
          }

          await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', profile.id);

          console.log(`Subscription updated for user ${profile.id}: ${plan}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              plan: 'free',
              stripe_subscription_id: null,
            })
            .eq('id', profile.id);

          console.log(`Subscription cancelled for user ${profile.id}`);
        }
        break;
      }
    }
  } catch (err: any) {
    console.error('Error processing webhook:', err.message);
    return new Response(`Webhook handler error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
