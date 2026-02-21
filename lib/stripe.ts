export const STRIPE_PRO_LINK = 'https://buy.stripe.com/7sY7sM2tObuWctSaE66c00a';
export const STRIPE_ELITE_LINK = 'https://buy.stripe.com/7sYeVe4BW6aCdxW27A6c009';

export function redirectToCheckout(priceLink: string, email?: string) {
  let url = priceLink;
  if (email) {
    url += `?prefilled_email=${encodeURIComponent(email)}`;
  }
  window.location.href = url;
}
