/** Moeda e idioma usados hoje em salários e planos. */
export const DEFAULT_CURRENCY = "BRL";
export const DEFAULT_MONEY_LOCALE = "pt-BR";

const ISO_CURRENCY = /^[A-Z]{3}$/;

/** Código ISO 4217 aceito pelo runtime. Três letras sozinhas não bastam. */
export function isIsoCurrency(value: string): boolean {
  const code = value.trim().toUpperCase();
  if (!ISO_CURRENCY.test(code)) return false;
  const supported = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  if (typeof supported === "function") {
    return supported("currency").includes(code);
  }
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: code }).format(0);
    return true;
  } catch {
    return false;
  }
}

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
  const safeCurrency = isIsoCurrency(code) ? code : DEFAULT_CURRENCY;
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: safeCurrency,
    }).format(amount);
  } catch {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: DEFAULT_CURRENCY,
      }).format(amount);
    } catch {
      return new Intl.NumberFormat(DEFAULT_MONEY_LOCALE, {
        style: "currency",
        currency: DEFAULT_CURRENCY,
      }).format(amount);
    }
  }
}
