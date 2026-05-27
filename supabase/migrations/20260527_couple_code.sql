-- =====================================================
-- MODO CASAL: vínculo por CÓDIGO (em vez de convite por e-mail)
-- =====================================================
-- Cada usuário tem um `couple_code` curto. O parceiro digita esse código
-- para vincular. As funções são SECURITY DEFINER (acham o dono pelo código
-- ignorando RLS, e escrevem partner_id que é travado para o cliente).
-- =====================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS couple_code text UNIQUE;

-- Retorna (gerando na primeira vez) o código do usuário atual.
CREATE OR REPLACE FUNCTION public.my_couple_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing text;
  v_code text;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- sem 0/O/1/I (ambíguos)
  i int;
BEGIN
  SELECT couple_code INTO v_existing FROM public.profiles WHERE id = auth.uid();
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  LOOP
    v_code := '';
    FOR i IN 1..6 LOOP
      v_code := v_code || substr(v_alphabet, floor(random() * length(v_alphabet))::int + 1, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE couple_code = v_code);
  END LOOP;

  UPDATE public.profiles SET couple_code = v_code WHERE id = auth.uid();
  RETURN v_code;
END;
$$;

-- Vincula o usuário atual ao dono do código informado.
CREATE OR REPLACE FUNCTION public.link_couple_by_code(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_owner uuid;
  v_owner_partner uuid;
  v_my_partner uuid;
BEGIN
  SELECT id, partner_id INTO v_owner, v_owner_partner
  FROM public.profiles WHERE couple_code = upper(trim(p_code));

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Código inválido';
  END IF;
  IF v_owner = v_me THEN
    RAISE EXCEPTION 'Esse é o seu próprio código';
  END IF;

  SELECT partner_id INTO v_my_partner FROM public.profiles WHERE id = v_me;
  IF v_my_partner IS NOT NULL THEN
    RAISE EXCEPTION 'Você já está vinculado a alguém';
  END IF;
  IF v_owner_partner IS NOT NULL THEN
    RAISE EXCEPTION 'Esse usuário já está vinculado a alguém';
  END IF;

  UPDATE public.profiles SET partner_id = v_owner WHERE id = v_me;
  UPDATE public.profiles SET partner_id = v_me   WHERE id = v_owner;
END;
$$;

GRANT EXECUTE ON FUNCTION public.my_couple_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_couple_by_code(text) TO authenticated;
