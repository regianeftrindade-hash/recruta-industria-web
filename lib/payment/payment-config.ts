import { getPagSeguroConfig } from '@/lib/pagseguro-client';

/** Tipos de cobrança registrados em PaymentRecord.meta */
export type PaymentMetaType = 'company_subscription' | 'professional_subscription';

export type CompanyPaymentMeta = {
  type: 'company_subscription';
  planTier: string;
  companyUserId: string;
  expectedAmount: number;
  billingPeriod?: 'monthly' | 'annual';
  billingMode?: 'one_time' | 'recurring';
  gatewaySubscriptionId?: string;
  isRenewal?: boolean;
};

export type ProfessionalPaymentMeta = {
  type: 'professional_subscription';
  planTier: string;
  professionalUserId: string;
  expectedAmount: number;
  billingPeriod?: 'monthly' | 'annual';
  billingMode?: 'one_time' | 'recurring';
  gatewaySubscriptionId?: string;
  isRenewal?: boolean;
};

export const PAYMENT_CONFIG = {
  currency: 'BRL',
  monthlySubscriptionDays: 30,
  annualSubscriptionDays: 365,
  annualBillableMonths: 10,
  /** @deprecated use monthlySubscriptionDays */
  companySubscriptionDays: 30,
  /** @deprecated use monthlySubscriptionDays */
  professionalSubscriptionDays: 30,
  sandboxApiUrl: 'https://sandbox.api.pagseguro.com',
  productionApiUrl: 'https://api.pagseguro.com',
  sandboxSubscriptionsApiUrl: 'https://sandbox.api.assinaturas.pagseguro.com',
  productionSubscriptionsApiUrl: 'https://api.assinaturas.pagseguro.com',
} as const;

export function isPaymentGatewayConfigured(): boolean {
  return Boolean(getPagSeguroConfig().token);
}

export function isSandboxMode(): boolean {
  const { apiUrl } = getPagSeguroConfig();
  return apiUrl.includes('sandbox');
}

export function parsePaymentMeta(meta: string | null | undefined): Record<string, unknown> | null {
  if (!meta) return null;
  try {
    const parsed = JSON.parse(meta) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function asCompanyPaymentMeta(meta: string | null | undefined): CompanyPaymentMeta | null {
  const parsed = parsePaymentMeta(meta);
  if (!parsed || parsed.type !== 'company_subscription') return null;
  if (typeof parsed.planTier !== 'string') return null;
  if (typeof parsed.companyUserId !== 'string') return null;
  if (typeof parsed.expectedAmount !== 'number') return null;
  return parsed as CompanyPaymentMeta;
}

export function asProfessionalPaymentMeta(meta: string | null | undefined): ProfessionalPaymentMeta | null {
  const parsed = parsePaymentMeta(meta);
  if (!parsed || parsed.type !== 'professional_subscription') return null;
  if (typeof parsed.planTier !== 'string') return null;
  if (typeof parsed.professionalUserId !== 'string') return null;
  if (typeof parsed.expectedAmount !== 'number') return null;
  return parsed as ProfessionalPaymentMeta;
}
