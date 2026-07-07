import { prisma } from '@/lib/db';
import { setCompanyPlanTier } from '@/lib/company-storage';
import { asCompanyPaymentMeta } from '@/lib/payment-config';
import {
  getPlanDefinition,
  getPaidPlanTiers,
  type CompanyPlanTier,
} from '@/lib/company-premium-plans';
import {
  getPlanPriceCentavos,
  parseBillingMode,
  parseBillingPeriod,
  type BillingMode,
  type BillingPeriod,
} from '@/lib/billing';
import { getSubscriptionDays } from '@/lib/billing';

type PaymentRow = {
  id: string;
  reference: string;
  amount: number;
  status: string;
  meta: string | null;
};

export function validateCompanyPaymentForActivation(
  payment: PaymentRow,
  companyUserId: string,
  planTier: CompanyPlanTier,
  billingPeriod?: BillingPeriod,
  billingMode?: BillingMode,
): string | null {
  if (payment.status !== 'PAID') {
    return 'Pagamento ainda não confirmado';
  }

  const meta = asCompanyPaymentMeta(payment.meta);
  if (!meta) {
    return 'Cobrança sem vínculo de plano empresa';
  }

  if (meta.companyUserId !== companyUserId) {
    return 'Cobrança não pertence a esta empresa';
  }

  if (meta.planTier !== planTier) {
    return 'Plano da cobrança não confere com o solicitado';
  }

  const period = billingPeriod ?? parseBillingPeriod(meta.billingPeriod);
  const mode = billingMode ?? parseBillingMode(meta.billingMode);

  const planDef = getPlanDefinition(planTier);
  const expected = getPlanPriceCentavos(planDef.precoCentavos, period);

  if (expected !== Math.round(payment.amount)) {
    return 'Valor pago não confere com o plano';
  }

  if (meta.expectedAmount !== expected) {
    return 'Metadados da cobrança inválidos';
  }

  if (!getPaidPlanTiers().includes(planTier)) {
    return 'Plano inválido';
  }

  if (mode === 'recurring' && !meta.gatewaySubscriptionId) {
    return 'Assinatura recorrente sem vínculo no gateway';
  }

  return null;
}

export async function activateCompanyPlanFromPayment(
  companyUserId: string,
  chargeId: string,
  planTier: CompanyPlanTier,
  options?: {
    billingPeriod?: BillingPeriod;
    billingMode?: BillingMode;
    gatewaySubscriptionId?: string;
    isRenewal?: boolean;
  },
): Promise<{ alreadyActive: boolean }> {
  const payment = await prisma.paymentRecord.findUnique({
    where: { reference: chargeId },
  });

  if (!payment) {
    throw new Error('Cobrança não encontrada');
  }

  const meta = asCompanyPaymentMeta(payment.meta);
  const period = options?.billingPeriod ?? parseBillingPeriod(meta?.billingPeriod);
  const mode = options?.billingMode ?? parseBillingMode(meta?.billingMode);
  const gatewaySubscriptionId = options?.gatewaySubscriptionId ?? meta?.gatewaySubscriptionId;

  const validationError = validateCompanyPaymentForActivation(
    payment,
    companyUserId,
    planTier,
    period,
    mode,
  );

  if (validationError) {
    throw new Error(validationError);
  }

  const company = await prisma.company.findFirst({
    where: { userId: companyUserId },
    select: { planTier: true },
  });

  const alreadyActive = company?.planTier === planTier && !options?.isRenewal && !meta?.isRenewal;

  if (!alreadyActive || options?.isRenewal || meta?.isRenewal) {
    await setCompanyPlanTier(companyUserId, planTier, {
      billingPeriod: period,
      billingMode: mode,
      autoRenew: mode === 'recurring',
      gatewaySubscriptionId: gatewaySubscriptionId ?? null,
      extendFromCurrent: Boolean(options?.isRenewal || meta?.isRenewal),
    });
  }

  return { alreadyActive: alreadyActive && !options?.isRenewal && !meta?.isRenewal };
}

export function buildCompanyPaymentDescription(
  planTier: CompanyPlanTier,
  billingPeriod: BillingPeriod = 'monthly',
  billingMode: BillingMode = 'one_time',
): string {
  const plan = getPlanDefinition(planTier);
  const days = getSubscriptionDays(billingPeriod);
  const modeLabel = billingMode === 'recurring' ? 'assinatura recorrente' : 'pagamento único';
  const periodLabel = billingPeriod === 'annual' ? 'anual' : 'mensal';
  return `Plano ${plan.nome} Empresa (${periodLabel}, ${modeLabel}) - Recruta Indústria (${days} dias)`;
}
