/**
 * Mercado de pagamento por país de faturamento.
 * BR → Asaas | demais → Stripe (quando configurado).
 * O idioma da interface NÃO escolhe o provedor.
 */

export type PaymentMarket = 'BR' | 'INTL';

export function paymentMarketForCountry(
  countryCode: string | null | undefined,
): PaymentMarket {
  const code = (countryCode || '').trim().toUpperCase();
  if (code === 'BR' || code === 'BRA') return 'BR';
  return 'INTL';
}

export function shouldUseStripe(
  countryCode: string | null | undefined,
): boolean {
  return paymentMarketForCountry(countryCode) === 'INTL';
}

/** Extrai countryCode de perfil (user.countryCode ou company.country). */
export function billingCountryFromProfile(
  countryCode: string | null | undefined,
): string | null {
  if (!countryCode) return null;
  const c = countryCode.trim().toUpperCase();
  if (c === 'BRA') return 'BR';
  return c || null;
}
