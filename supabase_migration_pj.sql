-- ============================================
-- Migration: PJ (Pessoa Jurídica) tables
-- Notas Fiscais, Contas a Receber, Impostos
-- ============================================

-- 1. Invoices (Notas Fiscais)
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  type text CHECK (type IN ('emitida', 'recebida')) NOT NULL DEFAULT 'emitida',
  status text CHECK (status IN ('emitida', 'pendente', 'cancelada')) NOT NULL DEFAULT 'pendente',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  client_name text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
  ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices"
  ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices"
  ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices"
  ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- 2. Receivables (Contas a Receber)
CREATE TABLE IF NOT EXISTS public.receivables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_name text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  status text CHECK (status IN ('pending', 'received', 'overdue')) NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own receivables"
  ON public.receivables FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own receivables"
  ON public.receivables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own receivables"
  ON public.receivables FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own receivables"
  ON public.receivables FOR DELETE USING (auth.uid() = user_id);

-- 3. Taxes (Impostos)
CREATE TABLE IF NOT EXISTS public.taxes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tax_name text NOT NULL,
  description text,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  status text CHECK (status IN ('pending', 'paid', 'overdue')) NOT NULL DEFAULT 'pending',
  recurrence text CHECK (recurrence IN ('once', 'monthly', 'quarterly', 'yearly')) DEFAULT 'monthly',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.taxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own taxes"
  ON public.taxes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own taxes"
  ON public.taxes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own taxes"
  ON public.taxes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own taxes"
  ON public.taxes FOR DELETE USING (auth.uid() = user_id);
