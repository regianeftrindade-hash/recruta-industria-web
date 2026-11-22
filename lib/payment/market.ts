/**
 * Mercado de cobrança.
 * Brasil → Asaas exclusivamente.
 * Demais países → Stripe (quando configurado).
 * O idioma da interface NÃO determina o provedor.
 * Sem país informado → BR (produto padrão brasileiro).
 */
export type PaymentMarket = "BR" | "INTL";

export function paymentMarketForCountry(
  countryCode: string | null | undefined,
): PaymentMarket {
  const code = (countryCode || "BR").trim().toUpperCase();
  if (code === "BR" || code === "BRA") return "BR";
  if (!code || code.length < 2) return "BR";
  return "INTL";
}

/** País de faturamento (ISO 3166-1 alpha-2). Padrão BR. */
export function billingCountryFromProfile(
  countryCode: string | null | undefined,
): string {
  const code = (countryCode || "BR").trim().toUpperCase();
  if (code === "BRA") return "BR";
  return /^[A-Z]{2}$/.test(code) ? code : "BR";
}
