// Configuração central dos planos do Corelys.
// Modelo: Individual e Casal (anual, parcelável em até 12x). Sem plano grátis
// permanente — novos usuários têm trial; quem não assina cai no paywall.
//
// ⚠️ SUBSTITUA `link` e `priceId` pelos valores REAIS do Stripe quando criar os
// produtos (Individual = R$ 358,80/ano em 12x; Casal = preço a definir).
// O `priceId` é usado pelo webhook para mapear o pagamento ao plano correto.

export type PlanId = 'individual' | 'casal';

export interface PlanConfig {
  id: PlanId;
  name: string;
  tagline: string;
  priceLabel: string; // chamada principal, ex: "12x R$ 29,90"
  priceSub: string;   // detalhe, ex: "R$ 358,80/ano"
  link: string;       // payment link (buy.stripe.com)
  priceId: string;    // price_... (Stripe) — usado pelo webhook
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
    link: 'https://buy.stripe.com/7sY7sM2tObuWctSaE66c00a', // TODO: link real do Individual
    priceId: '', // TODO: price_... do Individual
    highlight: false,
    perks: [
      'Dashboard inteligente',
      'Treinos e nutrição ilimitados',
      'Controle financeiro PF e PJ',
      'Hábitos, projetos e tarefas',
      'Calendário e relatórios',
      'Assistente via WhatsApp',
    ],
  },
  {
    id: 'casal',
    name: 'Casal',
    tagline: 'Para você e seu parceiro(a)',
    priceLabel: 'R$ —', // TODO: definir preço do Casal
    priceSub: 'por ano',
    link: 'https://buy.stripe.com/7sYeVe4BW6aCdxW27A6c009', // TODO: link real do Casal
    priceId: '', // TODO: price_... do Casal
    highlight: true,
    perks: [
      'Tudo do plano Individual',
      'Conta compartilhada entre os dois',
      'Finanças, tarefas e agenda em conjunto',
      'Saúde e ciclo continuam privados',
      'Vínculo por código, simples e seguro',
    ],
  },
];

export const getPlan = (id: PlanId) => PLANS.find((p) => p.id === id);

// Aliases de conveniência
export const STRIPE_INDIVIDUAL_LINK = PLANS[0].link;
export const STRIPE_CASAL_LINK = PLANS[1].link;

export function redirectToCheckout(priceLink: string, email?: string) {
  let url = priceLink;
  if (email) {
    url += `?prefilled_email=${encodeURIComponent(email)}`;
  }
  window.location.href = url;
}
