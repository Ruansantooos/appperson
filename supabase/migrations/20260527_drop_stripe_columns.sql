-- Remove as colunas do Stripe de public.profiles (migração para a Ticto).
-- A Ticto mapeia o usuário pelo e-mail no postback, então não precisamos guardar
-- customer/subscription id. plan e plan_expires_at continuam (alterados só pelo
-- service_role via ticto-webhook).

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id;
