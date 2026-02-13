-- 1. Subscription System Updates
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'premium',
ADD COLUMN IF NOT EXISTS plan_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Update existing users to premium
UPDATE public.profiles SET plan = 'premium' WHERE plan IS NULL;

-- 2. Payment History Table
CREATE TABLE IF NOT EXISTS public.payment_history (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    amount numeric NOT NULL,
    currency text DEFAULT 'BRL',
    status text,
    payment_method text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment history"
    ON public.payment_history FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Business (PJ) Separation & classification
-- Add project_id and classification to transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id),
ADD COLUMN IF NOT EXISTS classification text CHECK (classification IN ('Custo', 'Despesa', 'Investimento', 'Outros')) DEFAULT 'Despesa';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON public.transactions(project_id);

-- 4. Re-apply policies (Ensure security)
-- Transactions
DROP POLICY IF EXISTS "Users can insert own transactions." ON public.transactions;
CREATE POLICY "Users can insert own transactions."
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions." ON public.transactions;
CREATE POLICY "Users can delete own transactions."
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);
