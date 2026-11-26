/** Cadastro mínimo exigido para a busca de profissionais. */
export type CompanySearchRegistration = {
  name?: string | null;
  cnpj?: string | null;
  responsavelNome?: string | null;
  responsavelCpf?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  /** ISO-3166 alpha-2; fora do BR não exige CNPJ/CPF. */
  countryCode?: string | null;
};

/**
 * A conta de teste empresarial entra na busca mesmo sem telefone e endereço.
 * Brasil: CNPJ + CPF do responsável + telefone + endereço.
 * Exterior: nome, responsável, telefone e endereço (sem CNPJ/CPF).
 */
export function companyCanSearchProfessionals(
  registration: CompanySearchRegistration,
  bypass: boolean,
): boolean {
  if (bypass) return true;

  const country = (registration.countryCode || "BR").trim().toUpperCase() || "BR";
  const isBrazil = country === "BR";
  const endereco = (registration.endereco || "").trim();

  if (
    !registration.name?.trim() ||
    !registration.responsavelNome?.trim() ||
    !registration.telefone?.trim() ||
    endereco.length < 5
  ) {
    return false;
  }

  if (!isBrazil) {
    return true;
  }

  const cnpj = (registration.cnpj || "").replace(/\D/g, "");
  const cpf = (registration.responsavelCpf || "").replace(/\D/g, "");
  return cnpj.length === 14 && cpf.length === 11;
}
