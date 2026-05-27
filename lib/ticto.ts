// Configuração central do plano do Corelys — checkout via TICTO.
// Modelo: plano único (anual, parcelável em até 12x). Sem plano grátis permanente
// — novos usuários têm trial; quem não assina cai no paywall. Casais: cada pessoa
// assina o plano e vincula a conta pelo código (ver lib/couple.ts).

export type PlanId = 'individual';

export interface PlanConfig {
  id: PlanId;
  name: string;
  tagline: string;
  priceLabel: string; // chamada principal, ex: "12x R$ 29,90"
  priceSub: string;   // detalhe, ex: "R$ 358,80/ano"
  link: string;       // URL de checkout da Ticto
  productId: string;  // ID do produto na Ticto — usado pelo webhook p/ mapear o plano
  highlight: boolean;
  perks: string[];
}

export const PLANS: PlanConfig[] = [
  {
    id: 'individual',
    name: 'Individual',
    tagline: 'Todo o Corelys, só para você',
    priceLabel: '12x R$ 29,90',
    priceSub: 'R$ 358,80/ano',
    link: 'https://checkout.ticto.app/O9CD45FC9',
    productId: '', // TODO: ID do produto Ticto (ou use o offer_code O9CD45FC9 no webhook)
    highlight: true,
    perks: [
      'Dashboard inteligente',
      'Treinos e nutrição ilimitados',
      'Controle financeiro PF e PJ',
      'Hábitos, projetos e tarefas',
      'Calendário e relatórios',
      'Assistente de IA',
      'Modo casal: vincule contas por código',
    ],
  },
];

export const getPlan = (id: PlanId) => PLANS.find((p) => p.id === id);

/**
 * Redireciona para o checkout da Ticto, pré-preenchendo o e-mail quando possível.
 * Obs.: confirme o nome do parâmetro de prefill do seu checkout Ticto — aqui usamos
 * `?email=`; se o seu checkout não suportar, o usuário digita o e-mail na Ticto.
 */
export function redirectToCheckout(checkoutLink: string, email?: string) {
  if (!checkoutLink) {
    alert('Checkout indisponível no momento. Tente novamente em instantes.');
    return;
  }
  let url = checkoutLink;
  if (email) {
    url += (url.includes('?') ? '&' : '?') + `email=${encodeURIComponent(email)}`;
  }
  window.location.href = url;
}
