/**
 * Utilitários de data baseados no fuso horário LOCAL do usuário.
 *
 * Importante: NÃO use `new Date().toISOString().split('T')[0]` para obter "hoje".
 * `toISOString()` converte para UTC, então no Brasil (UTC-3) entre ~21h e meia-noite
 * a data retornada já é a do dia seguinte — quebrando reset de hábitos, logs e
 * comparações de "hoje". Estas funções usam os componentes locais da data.
 */

/** Retorna uma data no formato YYYY-MM-DD usando o fuso local. */
export const toLocalDateStr = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Retorna a data de hoje (YYYY-MM-DD) no fuso local. */
export const getToday = (): string => toLocalDateStr();

/** Retorna a data de N dias atrás (YYYY-MM-DD) no fuso local. */
export const daysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalDateStr(d);
};
