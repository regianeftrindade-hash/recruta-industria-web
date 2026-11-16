/** Mercado de cobrança. Só o Brasil está ligado; Asaas e PagBank não mudam aqui. */
export type PaymentMarket = "BR";

export function paymentMarketForCountry(countryCode: string | null | undefined): PaymentMarket | null {
  return (countryCode || "BR").trim().toUpperCase() === "BR" ? "BR" : null;
}
