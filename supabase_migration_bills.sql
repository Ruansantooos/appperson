-- ============================================
-- Migration: Bills table + finance_scope on existing tables
-- ============================================

-- 1. Create bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  recurrence text CHECK (recurrence IN ('once', 'weekly', 'monthly')) DEFAULT 'once',
  category text NOT NULL DEFAULT 'Others',
  status text CHECK (status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
  card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  finance_scope text CHECK (finance_scope IN ('pf', 'pj')) DEFAULT 'pf',
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Enable RLS on bills
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for bills
CREATE POLICY "Users can view own bills"
  ON public.bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bills"
  ON public.bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bills"
  ON public.bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bills"
  ON public.bills FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Add finance_scope column to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS finance_scope text
  CHECK (finance_scope IN ('pf', 'pj'))
  DEFAULT 'pf';

-- 5. Add finance_scope column to cards
ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS finance_scope text
  CHECK (finance_scope IN ('pf', 'pj'))
  DEFAULT 'pf';
