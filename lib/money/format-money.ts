/** Moeda e idioma usados hoje em salários e planos. */
export const DEFAULT_CURRENCY = "BRL";
export const DEFAULT_MONEY_LOCALE = "pt-BR";

const ISO_CURRENCY = /^[A-Z]{3}$/;

/**
 * Formata centavos na moeda informada, sem converter o valor.
 * Moeda ausente ou inválida volta para BRL. O padrão de idioma é pt-BR.
 */
export function formatMoney(
  cents: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_MONEY_LOCALE,
): string {
  const code = currency.trim().toUpperCase();
  const safeCurrency = ISO_CURRENCY.test(code) ? code : DEFAULT_CURRENCY;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: safeCurrency,
  }).format(cents / 100);
}
