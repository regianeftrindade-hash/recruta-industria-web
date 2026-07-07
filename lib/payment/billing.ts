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
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
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
      period: '/ano',
      savings: savings > 0
        ? `Economize ${formatPriceBRL(savings)} (2 meses grátis)`
        : undefined,
    };
  }

  return {
    price: formatPriceBRL(monthlyCentavos),
    period: '/mês',
  };
}

export function billingPeriodLabel(period: BillingPeriod): string {
  return period === 'annual' ? 'Anual' : 'Mensal';
}

export function billingModeLabel(mode: BillingMode): string {
  return mode === 'recurring'
    ? 'Assinatura recorrente automática'
    : 'Pagamento único (Pix ou Boleto)';
}
