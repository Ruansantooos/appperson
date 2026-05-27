-- =====================================================
-- MODO CASAL: compartilhamento de finanças + rotina entre 2 contas
-- =====================================================
-- Escopo compartilhado: transactions, cards, bills, tasks, calendar_events.
-- Saúde/treino/ciclo continuam PRIVADOS (não recebem policy de parceiro).
--
-- Vínculo é 1:1 (casal) via profiles.partner_id. O vínculo só é criado/desfeito
-- por funções SECURITY DEFINER — o cliente NÃO escreve partner_id direto
-- (impede vincular alguém sem consentimento e respeita a trava de colunas).
--
-- As policies de parceiro são ADITIVAS (permissivas): combinam por OR com as
-- policies "próprio dono" já existentes. Não removem nada.
-- =====================================================

-- 1) Vínculo de casal no profile ------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.profiles(id);

-- Helper: retorna o partner_id do usuário (SECURITY DEFINER evita recursão de RLS)
CREATE OR REPLACE FUNCTION public.partner_of(uid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT partner_id FROM public.profiles WHERE id = uid;
$$;

-- 2) Convites de casal ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.couple_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_name text,
  to_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | rejected
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.couple_invites ENABLE ROW LEVEL SECURITY;

-- Quem envia vê e gerencia os próprios convites; o destinatário (pelo e-mail) vê os recebidos.
DROP POLICY IF EXISTS "invite sender manages" ON public.couple_invites;
CREATE POLICY "invite sender manages" ON public.couple_invites
  FOR ALL USING ( from_user = auth.uid() ) WITH CHECK ( from_user = auth.uid() );

DROP POLICY IF EXISTS "invite recipient views" ON public.couple_invites;
CREATE POLICY "invite recipient views" ON public.couple_invites
  FOR SELECT USING ( lower(to_email) = lower(auth.jwt() ->> 'email') );

-- Destinatário pode marcar como rejeitado
DROP POLICY IF EXISTS "invite recipient updates" ON public.couple_invites;
CREATE POLICY "invite recipient updates" ON public.couple_invites
  FOR UPDATE USING ( lower(to_email) = lower(auth.jwt() ->> 'email') );

-- 3) Aceitar / desvincular (SECURITY DEFINER) -----------------------------
CREATE OR REPLACE FUNCTION public.accept_couple_invite(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from uuid;
  v_email text;
  v_me uuid := auth.uid();
  v_my_email text := lower(auth.jwt() ->> 'email');
BEGIN
  SELECT from_user, lower(to_email) INTO v_from, v_email
  FROM public.couple_invites WHERE id = p_invite_id AND status = 'pending';

  IF v_from IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou já respondido';
  END IF;
  IF v_email <> v_my_email THEN
    RAISE EXCEPTION 'Este convite não é para você';
  END IF;
  IF v_from = v_me THEN
    RAISE EXCEPTION 'Não é possível vincular consigo mesmo';
  END IF;

  -- Vínculo mútuo
  UPDATE public.profiles SET partner_id = v_from WHERE id = v_me;
  UPDATE public.profiles SET partner_id = v_me   WHERE id = v_from;

  UPDATE public.couple_invites SET status = 'accepted' WHERE id = p_invite_id;
  -- Cancela outros convites pendentes envolvendo qualquer um dos dois
  UPDATE public.couple_invites SET status = 'rejected'
  WHERE status = 'pending' AND id <> p_invite_id
    AND (from_user IN (v_me, v_from) OR lower(to_email) IN (v_my_email, v_email));
END;
$$;

CREATE OR REPLACE FUNCTION public.unlink_partner()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_partner uuid := public.partner_of(auth.uid());
BEGIN
  UPDATE public.profiles SET partner_id = NULL WHERE id = v_me;
  IF v_partner IS NOT NULL THEN
    UPDATE public.profiles SET partner_id = NULL WHERE id = v_partner;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_couple_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlink_partner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.partner_of(uuid) TO authenticated;

-- Permite ver o perfil do parceiro (nome/e-mail na aba Casal).
-- Necessário porque a migration de segurança trava o SELECT de profiles ao próprio dono.
DROP POLICY IF EXISTS "partner can view profile" ON public.profiles;
CREATE POLICY "partner can view profile" ON public.profiles
  FOR SELECT USING ( id = public.partner_of(auth.uid()) );

-- 4) Policies de parceiro nas tabelas compartilhadas ----------------------
-- Para cada tabela: o parceiro pode VER, EDITAR e EXCLUIR as linhas do outro.
-- INSERT continua sendo do próprio dono (cada um cria com o seu user_id).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['transactions','cards','bills','tasks','calendar_events']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "partner can view %1$s" ON public.%1$s;', t);
    EXECUTE format(
      'CREATE POLICY "partner can view %1$s" ON public.%1$s FOR SELECT USING (user_id = public.partner_of(auth.uid()));', t);

    EXECUTE format('DROP POLICY IF EXISTS "partner can update %1$s" ON public.%1$s;', t);
    EXECUTE format(
      'CREATE POLICY "partner can update %1$s" ON public.%1$s FOR UPDATE USING (user_id = public.partner_of(auth.uid()));', t);

    EXECUTE format('DROP POLICY IF EXISTS "partner can delete %1$s" ON public.%1$s;', t);
    EXECUTE format(
      'CREATE POLICY "partner can delete %1$s" ON public.%1$s FOR DELETE USING (user_id = public.partner_of(auth.uid()));', t);
  END LOOP;
END $$;

-- Conferência (opcional):
-- SELECT tablename, policyname, cmd FROM pg_policies
--   WHERE tablename IN ('transactions','cards','bills','tasks','calendar_events')
--   ORDER BY tablename, cmd;
