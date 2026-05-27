-- =====================================================
-- SEGURANÇA: travar RLS e privilégios da tabela profiles
-- =====================================================
-- Corrige dois problemas:
--   1. SELECT era público (USING true) -> qualquer um lia email, nome,
--      IDs do Stripe, etc. de TODOS os usuários. Agora só o próprio dono lê.
--   2. UPDATE permitia alterar qualquer coluna, inclusive `plan` e os campos
--      do Stripe -> usuário podia se dar plano pago de graça pelo console.
--      Passamos a permitir UPDATE apenas nas colunas de perfil; plano e
--      billing só podem ser alterados pelo service_role (webhook do Stripe),
--      que ignora RLS e privilégios de coluna.
--
-- Aplicar no SQL Editor do Supabase OU via `supabase db push`.
-- =====================================================

-- 1) SELECT: somente o próprio perfil ------------------------------------
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile." ON public.profiles;

CREATE POLICY "Users can view own profile."
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

-- 2) UPDATE: manter a policy de linha (só o dono) -------------------------
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id )
  WITH CHECK ( auth.uid() = id );

-- 3) Restrição por COLUNA: bloqueia plan / billing no client --------------
-- Remove o UPDATE amplo e concede de volta só as colunas de perfil.
-- Colunas protegidas (não concedidas): plan, plan_expires_at,
-- stripe_customer_id, stripe_subscription_id, id.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;

GRANT UPDATE (
  email,
  full_name,
  avatar_url,
  gender,
  birth_date,
  height,
  activity_level,
  goal,
  updated_at
) ON public.profiles TO authenticated;

-- 4) Corrige o DEFAULT do plano -------------------------------------------
-- Era 'premium' (valor inválido — os planos são free/pro/elite), o que dava
-- plano pago de graça a qualquer perfil criado fora do fluxo de cadastro.
-- Novos perfis passam a nascer como 'free'. NÃO altera usuários existentes.
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'free';

-- Conferência (opcional): listar policies e grants resultantes
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'profiles';
-- SELECT grantee, privilege_type, column_name FROM information_schema.column_privileges
--   WHERE table_name = 'profiles' AND privilege_type = 'UPDATE';
