/** Helpers do "modo casal" — compartilhamento de finanças + rotina entre 2 contas. */
import { supabase } from './supabase';

/** IDs cujos dados o usuário pode ver/editar: ele mesmo + parceiro (se houver). */
export const circleIds = (userId: string, partnerId?: string | null): string[] =>
  partnerId ? [userId, partnerId] : [userId];

export interface CoupleInvite {
  id: string;
  from_user: string;
  from_name: string | null;
  to_email: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at?: string;
}

/** Envia um convite de casal para um e-mail. */
export async function sendCoupleInvite(fromUser: string, fromName: string, toEmail: string) {
  return supabase.from('couple_invites').insert({
    from_user: fromUser,
    from_name: fromName,
    to_email: toEmail.trim().toLowerCase(),
    status: 'pending',
  });
}

/** Convites pendentes que EU recebi (pelo meu e-mail). */
export async function fetchReceivedInvites(email: string) {
  return supabase
    .from('couple_invites')
    .select('*')
    .eq('status', 'pending')
    .ilike('to_email', email.trim().toLowerCase());
}

/** Convites que EU enviei. */
export async function fetchSentInvites(userId: string) {
  return supabase
    .from('couple_invites')
    .select('*')
    .eq('from_user', userId)
    .order('created_at', { ascending: false });
}

export const acceptCoupleInvite = (inviteId: string) =>
  supabase.rpc('accept_couple_invite', { p_invite_id: inviteId });

export const rejectCoupleInvite = (inviteId: string) =>
  supabase.from('couple_invites').update({ status: 'rejected' }).eq('id', inviteId);

export const unlinkPartner = () => supabase.rpc('unlink_partner');

/** Retorna (gerando na 1ª vez) o código de vínculo do usuário atual. */
export const getMyCoupleCode = () => supabase.rpc('my_couple_code');

/** Vincula o usuário atual ao dono do código informado. */
export const linkCoupleByCode = (code: string) =>
  supabase.rpc('link_couple_by_code', { p_code: code.trim().toUpperCase() });

/** Busca nome/e-mail do parceiro para exibição. */
export async function fetchPartnerInfo(partnerId: string) {
  return supabase.from('profiles').select('full_name, email').eq('id', partnerId).maybeSingle();
}
