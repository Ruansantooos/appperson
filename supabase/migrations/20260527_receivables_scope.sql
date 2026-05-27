-- Adiciona coluna finance_scope na tabela public.receivables
ALTER TABLE public.receivables 
ADD COLUMN IF NOT EXISTS finance_scope text CHECK (finance_scope IN ('pf', 'pj')) DEFAULT 'pf';

-- Atualiza dados existentes para 'pj' (uma vez que antes a tela só existia no escopo de faturamento de PJ)
UPDATE public.receivables 
SET finance_scope = 'pj' 
WHERE finance_scope IS NULL;
