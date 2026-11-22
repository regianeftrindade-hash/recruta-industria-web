/**
 * Mercado de cobrança.
 * Brasil → Asaas exclusivamente.
 * Demais países → Stripe (quando configurado).
 * O idioma da interface NÃO determina o provedor.
 */
export type PaymentMarket = "BR" | "INTL";

export function paymentMarketForCountry(
  countryCode: string | null | undefined,
): PaymentMarket {
  const code = (countryCode || "BR").trim().toUpperCase();
  return code === "BR" ? "BR" : "INTL";
}

/** País de faturamento (ISO 3166-1 alpha-2). */
export function billingCountryFromProfile(
  countryCode: string | null | undefined,
): string {
  const code = (countryCode || "BR").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "BR";
}
