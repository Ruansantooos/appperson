// Cliente do assistente de IA in-app (Edge Function `assistant`).
// O supabase-js anexa automaticamente o Authorization: Bearer <access_token>
// da sessão atual, então a function roda escopada ao usuário (RLS aplicado).

import { supabase } from './supabase';
import { getToday } from './date';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Envia o histórico de conversa ao assistente e devolve a resposta em texto.
 * `history` deve começar com uma mensagem do usuário e alternar os papéis.
 */
export async function sendToAssistant(history: ChatMessage[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke('assistant', {
    body: {
      messages: history,
      today: getToday(),               // data local -> "hoje"/"amanhã" no fuso do usuário
      now: new Date().toISOString(),
    },
  });

  if (error) throw new Error(error.message || 'Falha ao falar com o assistente.');
  if (data?.error) throw new Error(data.error);
  return (data?.reply as string) ?? '';
}
