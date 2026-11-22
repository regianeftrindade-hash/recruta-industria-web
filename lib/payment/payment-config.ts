import { getAsaasConfig } from '@/lib/payment/asaas-client';
import { getPagSeguroConfig } from '@/lib/pagseguro-client';
import { isStripeEnabled, shouldUseStripe } from '@/lib/payment/stripe-client';
import { paymentMarketForCountry } from '@/lib/payment/market';

/**
 * Provedores suportados.
 * Regra comercial: Brasil → Asaas; internacional → Stripe.
 * PagSeguro permanece no tipo apenas para registros legados / status de cobranças antigas.
 */
export type PaymentProvider = 'pagseguro' | 'asaas' | 'stripe';

/**
 * Provedor padrão para o mercado Brasil.
 * Prioriza Asaas. PagSeguro só se forçado explicitamente (legado).
 */
export function getPaymentProvider(): PaymentProvider {
  const explicit = (process.env.PAYMENT_PROVIDER || '').trim().toLowerCase();
  if (explicit === 'asaas') return 'asaas';
  if (explicit === 'stripe') return 'stripe';
  if (explicit === 'pagseguro' || explicit === 'pagbank') return 'pagseguro';

  const asaasKey = getAsaasConfig().apiKey;
  if (asaasKey) return 'asaas';

  const pagseguroToken = getPagSeguroConfig().token;
  if (pagseguroToken) return 'pagseguro';
  return 'asaas';
}

/**
 * Escolhe o provedor pelo país de faturamento (não pelo idioma).
 * BR → Asaas (exclusivo para novas cobranças quando configurado)
 * INTL → Stripe se configurado; caso contrário null (checkout indisponível)
 */
export function resolvePaymentProvider(
  billingCountryCode: string | null | undefined,
): PaymentProvider | null {
  if (shouldUseStripe(billingCountryCode)) return 'stripe';
  if (paymentMarketForCountry(billingCountryCode) === 'BR') {
    const br = getPaymentProvider();
    return br === 'stripe' ? 'asaas' : br;
  }
  return null;
}

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
  provider?: PaymentProvider;
  stripePriceId?: string;
  stripeEventId?: string;
};

export type CompanyExtraSeatsPaymentMeta = {
  type: 'company_extra_seats';
  companyUserId: string;
  quantity: number;
  expectedAmount: number;
  activatedAt?: string;
  provider?: PaymentProvider;
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
  provider?: PaymentProvider;
  stripePriceId?: string;
  stripeEventId?: string;
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

export function isPaymentGatewayConfiguredForCountry(
  billingCountryCode: string | null | undefined,
): boolean {
  const provider = resolvePaymentProvider(billingCountryCode);
  if (provider === 'stripe') return isStripeEnabled();
  if (provider === 'asaas') return Boolean(getAsaasConfig().apiKey);
  if (provider === 'pagseguro') return Boolean(getPagSeguroConfig().token);
  return false;
}

export function isPaymentGatewayConfigured(): boolean {
  if (getPaymentProvider() === 'asaas') {
    return Boolean(getAsaasConfig().apiKey);
  }
  if (getPaymentProvider() === 'stripe') {
    return isStripeEnabled();
  }
  return Boolean(getPagSeguroConfig().token);
}

export function isSandboxMode(): boolean {
  if (getPaymentProvider() === 'asaas') {
    return getAsaasConfig().apiUrl.includes('sandbox');
  }
  if (getPaymentProvider() === 'stripe') {
    return (process.env.STRIPE_SECRET_KEY || '').includes('_test_');
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
