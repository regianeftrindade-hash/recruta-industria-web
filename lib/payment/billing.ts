import { formatMoney } from '@/lib/money/format-money';
import { uiIntlLocale } from '@/lib/i18n/format-ui';
import { t } from '@/lib/i18n/translate';
import { PAYMENT_CONFIG } from '@/lib/payment-config';

export type BillingPeriod = 'monthly' | 'annual';
export type BillingMode = 'one_time' | 'recurring';

export function parseBillingPeriod(value: unknown): BillingPeriod {
  return String(value || '').toLowerCase() === 'annual' ? 'annual' : 'monthly';
}

export function parseBillingMode(value: unknown): BillingMode {
  return String(value || '').toLowerCase() === 'recurring' ? 'recurring' : 'one_time';
}

/** Meses cobrados no plano anual (2 meses de desconto). */
export function getAnnualBillableMonths(): number {
  return PAYMENT_CONFIG.annualBillableMonths;
}

export function getSubscriptionDays(period: BillingPeriod): number {
  return period === 'annual'
    ? PAYMENT_CONFIG.annualSubscriptionDays
    : PAYMENT_CONFIG.monthlySubscriptionDays;
}

export function getMonthlyPriceCentavos(monthlyCentavos: number): number {
  return Math.round(monthlyCentavos);
}

export function getAnnualPriceCentavos(monthlyCentavos: number): number {
  return Math.round(monthlyCentavos * getAnnualBillableMonths());
}

export function getPlanPriceCentavos(
  monthlyCentavos: number,
  period: BillingPeriod,
): number {
  return period === 'annual'
    ? getAnnualPriceCentavos(monthlyCentavos)
    : getMonthlyPriceCentavos(monthlyCentavos);
}

export function formatPriceBRL(centavos: number): string {
  return formatMoney(centavos, 'BRL', uiIntlLocale());
}

export function formatPlanPriceLabel(
  monthlyCentavos: number,
  period: BillingPeriod,
): { price: string; period: string; savings?: string } {
  if (period === 'annual') {
    const annual = getAnnualPriceCentavos(monthlyCentavos);
    const fullYear = monthlyCentavos * 12;
    const savings = fullYear - annual;
    return {
      price: formatPriceBRL(annual),
      period: t('rest.billing.periodYear'),
      savings: savings > 0
        ? t('rest.billing.savingsMonths').replace('{amount}', formatPriceBRL(savings))
        : undefined,
    };
  }

  return {
    price: formatPriceBRL(monthlyCentavos),
    period: t('rest.billing.periodMonth'),
  };
}

export function billingPeriodLabel(period: BillingPeriod): string {
  return period === 'annual'
    ? t('rest.billing.periodAnnual')
    : t('rest.billing.periodMonthly');
}

export function billingModeLabel(mode: BillingMode): string {
  return mode === 'recurring'
    ? t('rest.billing.modeRecurring')
    : t('rest.billing.modeOneTime');
}

/** Preços de referência Stripe em centavos de USD (alinhados aos Price IDs do Dashboard). */
export const STRIPE_COMPANY_USD_CENTS: Record<string, number> = {
  BASIC: 4900, // USD 49
  PREMIUM: 9900, // USD 99
  EMPRESARIAL: 19900, // USD 199
};

export function getStripeCompanyMonthlyUsdCents(planTier: string): number | null {
  const key = String(planTier || '').toUpperCase();
  return STRIPE_COMPANY_USD_CENTS[key] ?? null;
}

export function getStripeCompanyPlanPriceUsdCents(
  planTier: string,
  period: BillingPeriod,
): number | null {
  const monthly = getStripeCompanyMonthlyUsdCents(planTier);
  if (monthly == null) return null;
  // Anual = 10× mensal (2 meses grátis), igual aos Price IDs YEARLY
  return period === 'annual' ? monthly * 10 : monthly;
}

export function formatPriceUSD(centavos: number): string {
  return formatMoney(centavos, 'USD', 'en-US');
}

/**
 * Rótulo de preço para checkout internacional (referência USD).
 * Não afirma moeda local — Adaptive Pricing é resolvido no Stripe Checkout.
 */
export function formatStripePlanPriceLabel(
  planTier: string,
  period: BillingPeriod,
): { price: string; period: string; savings?: string } {
  const monthly = getStripeCompanyMonthlyUsdCents(planTier);
  if (monthly == null) {
    return {
      price: '—',
      period: period === 'annual' ? t('rest.billing.periodYearUsd') : t('rest.billing.periodMonthUsd'),
    };
  }
  if (period === 'annual') {
    const annual = monthly * 10;
    const fullYear = monthly * 12;
    const savings = fullYear - annual;
    return {
      price: formatPriceUSD(annual),
      period: t('rest.billing.periodYearUsd'),
      savings: savings > 0
        ? t('rest.billing.savingsMonthsUsd').replace('{amount}', formatPriceUSD(savings))
        : undefined,
    };
  }
  return {
    price: formatPriceUSD(monthly),
    period: t('rest.billing.periodMonthUsd'),
  };
}
