export type CountryCapability = {
  code: string;
  signupEnabled: boolean;
  identityDocuments: readonly string[];
  phone: "BR" | "E164";
  currency: "BRL" | "USD" | null;
  timeZone: string | null;
  payments: "BR" | "INTL" | null;
};

/** Brasil: documentos, telefone e cobrança Asaas definidos. */
export const BRAZIL_CAPABILITY: CountryCapability = {
  code: "BR",
  signupEnabled: true,
  identityDocuments: ["CPF", "CNPJ"],
  phone: "BR",
  currency: "BRL",
  timeZone: "America/Sao_Paulo",
  payments: "BR",
};

/**
 * Capacidade por país de faturamento/residência.
 * Fora do Brasil: cadastro liberado, sem CPF/CNPJ, telefone E.164,
 * pagamentos via Stripe quando configurado.
 */
export function countryCapability(code: string | null | undefined): CountryCapability {
  const normalized = (code || "BR").trim().toUpperCase();
  if (normalized === "BR") return BRAZIL_CAPABILITY;
  return {
    code: normalized,
    signupEnabled: true,
    identityDocuments: [],
    phone: "E164",
    currency: null,
    timeZone: null,
    payments: "INTL",
  };
}
