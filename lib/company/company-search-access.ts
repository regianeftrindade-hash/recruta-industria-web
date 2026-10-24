/** Cadastro mínimo exigido para a busca de profissionais. */
export type CompanySearchRegistration = {
  name?: string | null;
  cnpj?: string | null;
  responsavelNome?: string | null;
  responsavelCpf?: string | null;
  telefone?: string | null;
  endereco?: string | null;
};

/**
 * A conta de teste empresarial entra na busca mesmo sem telefone e endereço.
 * As demais empresas precisam do cadastro completo.
 */
export function companyCanSearchProfessionals(
  registration: CompanySearchRegistration,
  bypass: boolean,
): boolean {
  if (bypass) return true;
  const cnpj = (registration.cnpj || "").replace(/\D/g, "");
  const cpf = (registration.responsavelCpf || "").replace(/\D/g, "");
  const endereco = (registration.endereco || "").trim();
  return Boolean(
    registration.name?.trim()
    && cnpj.length === 14
    && registration.responsavelNome?.trim()
    && cpf.length === 11
    && registration.telefone?.trim()
    && endereco.length >= 5,
  );
}
