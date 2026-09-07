import { getAsaasConfig } from '@/lib/payment/asaas-client';
import { getPagSeguroConfig } from '@/lib/pagseguro-client';

export type PaymentProvider = 'pagseguro' | 'asaas';

/** Provedor ativo: PAYMENT_PROVIDER ou detecção automática pela chave configurada. */
export function getPaymentProvider(): PaymentProvider {
  const explicit = (process.env.PAYMENT_PROVIDER || '').trim().toLowerCase();
  if (explicit === 'asaas') return 'asaas';
  if (explicit === 'pagseguro' || explicit === 'pagbank') return 'pagseguro';

  const asaasKey = getAsaasConfig().apiKey;
  const pagseguroToken = getPagSeguroConfig().token;

  if (asaasKey && !pagseguroToken) return 'asaas';
  return 'pagseguro';
}

/** Tipos de cobrança registrados em PaymentRecord.meta */
export type PaymentMetaType =
  | 'company_subscription'
  | 'company_extra_seats'
  | 'professional_subscription';

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

/** Usuário(s) RH extras acima do limite do plano */
export type CompanyExtraSeatsPaymentMeta = {
  type: 'company_extra_seats';
  companyUserId: string;
  quantity: number;
  expectedAmount: number;
  activatedAt?: string;
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
  if (getPaymentProvider() === 'asaas') {
    return Boolean(getAsaasConfig().apiKey);
  }
  return Boolean(getPagSeguroConfig().token);
}

export function isSandboxMode(): boolean {
  if (getPaymentProvider() === 'asaas') {
    return getAsaasConfig().apiUrl.includes('sandbox');
  }
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

export function asCompanyExtraSeatsPaymentMeta(
  meta: string | null | undefined,
): CompanyExtraSeatsPaymentMeta | null {
  const parsed = parsePaymentMeta(meta);
  if (!parsed || parsed.type !== 'company_extra_seats') return null;
  if (typeof parsed.companyUserId !== 'string') return null;
  if (typeof parsed.quantity !== 'number' || parsed.quantity < 1) return null;
  if (typeof parsed.expectedAmount !== 'number') return null;
  return parsed as CompanyExtraSeatsPaymentMeta;
}

export function asProfessionalPaymentMeta(meta: string | null | undefined): ProfessionalPaymentMeta | null {
  const parsed = parsePaymentMeta(meta);
  if (!parsed || parsed.type !== 'professional_subscription') return null;
  if (typeof parsed.planTier !== 'string') return null;
  if (typeof parsed.professionalUserId !== 'string') return null;
  if (typeof parsed.expectedAmount !== 'number') return null;
  return parsed as ProfessionalPaymentMeta;
}
