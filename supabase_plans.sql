-- =============================================
-- SISTEMA DE PLANOS - Corelys
-- Cole este SQL no Supabase SQL Editor
-- =============================================

-- 1. Adicionar coluna de plano na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'premium';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_expires_at timestamp with time zone;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- 2. Atualizar todos os usuários existentes para premium
UPDATE profiles SET plan = 'premium' WHERE plan IS NULL;

-- 3. Criar tabela de histórico de pagamentos (para quando integrar Stripe)
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users,
  amount numeric NOT NULL,
  currency text DEFAULT 'BRL',
  status text NOT NULL, -- 'succeeded', 'failed', 'pending', 'refunded'
  stripe_payment_id text,
  plan text DEFAULT 'premium',
  period_start date,
  period_end date,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. RLS policies para payment_history
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments." ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments." ON payment_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
