-- =============================================
-- Migration: Cards table + link to transactions
-- =============================================

-- 1. Create cards table
CREATE TABLE public.cards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  bank_name text NOT NULL,
  last_four_digits text NOT NULL,
  expiration_date text NOT NULL,
  card_type text CHECK (card_type IN ('credit', 'debit')) NOT NULL,
  card_limit numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for cards
CREATE POLICY "Users can view own cards"
  ON public.cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON public.cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON public.cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
  ON public.cards FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Add card_id column to transactions
ALTER TABLE public.transactions ADD COLUMN card_id uuid REFERENCES public.cards(id);
