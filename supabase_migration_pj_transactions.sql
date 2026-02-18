-- ============================================
-- Migration: Add PJ fields to transactions table
-- classification and project_id columns
-- ============================================

-- 1. Add classification column (Custo, Despesa, Investimento, Outros)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS classification text CHECK (classification IN ('Custo', 'Despesa', 'Investimento', 'Outros'));

-- 2. Add project_id column (link transaction to a project/business)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
