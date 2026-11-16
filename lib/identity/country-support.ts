export type CountryCapability = {
  code: string;
  signupEnabled: boolean;
  identityDocuments: readonly string[];
  phone: "BR" | "E164";
  currency: "BRL" | null;
  timeZone: "America/Sao_Paulo" | null;
  payments: "BR" | null;
};

/** Único país com cadastro, documento, telefone e cobrança definidos. */
export const BRAZIL_CAPABILITY: CountryCapability = {
  code: "BR",
  signupEnabled: true,
  identityDocuments: ["CPF", "CNPJ"],
  phone: "BR",
  currency: "BRL",
  timeZone: "America/Sao_Paulo",
  payments: "BR",
};

export function countryCapability(code: string | null | undefined): CountryCapability {
  const normalized = (code || "BR").trim().toUpperCase();
  if (normalized === "BR") return BRAZIL_CAPABILITY;
  return {
    code: normalized,
    signupEnabled: false,
    identityDocuments: [],
    phone: "E164",
    currency: null,
    timeZone: null,
    payments: null,
  };
}
