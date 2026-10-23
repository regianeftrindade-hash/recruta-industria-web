export type CompanyVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type CompanyVerificationInfo = {
  verificationStatus: CompanyVerificationStatus;
  verifiedAt: Date | null;
  rejectionReason: string | null;
  cartaoCnpjUrl: string | null;
  emailCorporativo: string | null;
  emailCorporativoVerificado: boolean;
  /** Cartão CNPJ anexado e aprovado pelo admin */
  isDocumentVerified: boolean;
  /** E-mail corporativo informado e confirmado por link */
  isEmailVerified: boolean;
  /** Libera contatos e dados sensíveis (e-mail + cartão verificados) */
  canAccessSensitiveProfiles: boolean;
};

export function isCompanyVerificationStatus(value: string | null | undefined): value is CompanyVerificationStatus {
  return value === 'PENDING' || value === 'VERIFIED' || value === 'REJECTED';
}

export const COMPANY_VIEW_ONLY_NOTICE =
  'Sem a verificação, o site fica só para visualização. Não é possível publicar vagas nem encontrar profissionais.';

export const COMPANY_FIELDS_NOTICE =
  'O cartão CNPJ e o e-mail corporativo em branco não impedem a entrada nem a visualização. Eles travam a publicação de vagas e a busca de profissionais.';

export function companyVerificationLabel(status: CompanyVerificationStatus): string {
  switch (status) {
    case 'VERIFIED':
      return 'Empresa verificada';
    case 'REJECTED':
      return 'Verificação recusada';
    default:
      return 'Aguardando verificação';
  }
}

export function companyDocumentsSubmitted(info: {
  cartaoCnpjUrl?: string | null;
  emailCorporativo?: string | null;
}): boolean {
  return Boolean(info.cartaoCnpjUrl?.trim() && info.emailCorporativo?.trim());
}

/** Tag visível no painel. Sem os dois campos preenchidos, pendente não vira "Em análise". */
export function companyVerificationTag(info: {
  verificationStatus: CompanyVerificationStatus;
  cartaoCnpjUrl?: string | null;
  emailCorporativo?: string | null;
}): 'Empresa verificada' | 'Em análise' | 'Verificação recusada' | null {
  if (info.verificationStatus === 'VERIFIED') return 'Empresa verificada';
  if (info.verificationStatus === 'REJECTED') return 'Verificação recusada';
  if (info.verificationStatus === 'PENDING' && companyDocumentsSubmitted(info)) return 'Em análise';
  return null;
}
