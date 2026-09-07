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
