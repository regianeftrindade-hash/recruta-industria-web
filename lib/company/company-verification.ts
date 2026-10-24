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
  'Enquanto o e-mail corporativo e o cartão CNPJ não forem verificados, a conta não tem acesso a profissionais nem à publicação de vagas.';

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

export type CompanyVerificationTag = 'Em análise' | 'Aprovada' | 'Reprovada';

/** Tag do status da conta. Aparece sempre: em análise, aprovada ou reprovada. */
export function companyVerificationTag(info: {
  verificationStatus: CompanyVerificationStatus;
  cartaoCnpjUrl?: string | null;
  emailCorporativo?: string | null;
}): CompanyVerificationTag {
  if (info.verificationStatus === 'VERIFIED') return 'Aprovada';
  if (info.verificationStatus === 'REJECTED') return 'Reprovada';
  return 'Em análise';
}
