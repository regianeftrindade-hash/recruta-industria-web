import { prisma } from '@/lib/db';
import { setProfessionalPlanTier, getProfessionalPlanTier } from '@/lib/professional-storage';
import { asProfessionalPaymentMeta } from '@/lib/payment-config';
import {
  getProfessionalPlanDefinition,
  getPaidProfessionalPlanTiers,
  type ProfessionalPlanTier,
} from '@/lib/professional-premium-plans';
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

export function validateProfessionalPaymentForActivation(
  payment: PaymentRow,
  professionalUserId: string,
  planTier: ProfessionalPlanTier,
  billingPeriod?: BillingPeriod,
  billingMode?: BillingMode,
): string | null {
  if (payment.status !== 'PAID') {
    return 'Pagamento ainda não confirmado';
  }

  const meta = asProfessionalPaymentMeta(payment.meta);
  if (!meta) {
    return 'Cobrança sem vínculo de plano profissional';
  }

  if (meta.professionalUserId !== professionalUserId) {
    return 'Cobrança não pertence a este profissional';
  }

  if (meta.planTier !== planTier) {
    return 'Plano da cobrança não confere com o solicitado';
  }

  const period = billingPeriod ?? parseBillingPeriod(meta.billingPeriod);
  const mode = billingMode ?? parseBillingMode(meta.billingMode);

  const planDef = getProfessionalPlanDefinition(planTier);
  const expected = getPlanPriceCentavos(planDef.precoCentavos, period);

  if (expected !== Math.round(payment.amount)) {
    return 'Valor pago não confere com o plano';
  }

  if (meta.expectedAmount !== expected) {
    return 'Metadados da cobrança inválidos';
  }

  if (!getPaidProfessionalPlanTiers().includes(planTier)) {
    return 'Plano inválido';
  }

  if (mode === 'recurring' && !meta.gatewaySubscriptionId) {
    return 'Assinatura recorrente sem vínculo no gateway';
  }

  return null;
}

export async function activateProfessionalPlanFromPayment(
  professionalUserId: string,
  chargeId: string,
  planTier: ProfessionalPlanTier,
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

  const meta = asProfessionalPaymentMeta(payment.meta);
  const period = options?.billingPeriod ?? parseBillingPeriod(meta?.billingPeriod);
  const mode = options?.billingMode ?? parseBillingMode(meta?.billingMode);
  const gatewaySubscriptionId = options?.gatewaySubscriptionId ?? meta?.gatewaySubscriptionId;

  const validationError = validateProfessionalPaymentForActivation(
    payment,
    professionalUserId,
    planTier,
    period,
    mode,
  );

  if (validationError) {
    throw new Error(validationError);
  }

  const currentTier = await getProfessionalPlanTier(professionalUserId);
  const alreadyActive = currentTier === planTier && !options?.isRenewal && !meta?.isRenewal;

  if (!alreadyActive || options?.isRenewal || meta?.isRenewal) {
    await setProfessionalPlanTier(professionalUserId, planTier, {
      billingPeriod: period,
      billingMode: mode,
      autoRenew: mode === 'recurring',
      gatewaySubscriptionId: gatewaySubscriptionId ?? null,
      extendFromCurrent: Boolean(options?.isRenewal || meta?.isRenewal),
    });
  }

  return { alreadyActive: alreadyActive && !options?.isRenewal && !meta?.isRenewal };
}

export function buildProfessionalPaymentDescription(
  planTier: ProfessionalPlanTier,
  billingPeriod: BillingPeriod = 'monthly',
  billingMode: BillingMode = 'one_time',
): string {
  const plan = getProfessionalPlanDefinition(planTier);
  const days = getSubscriptionDays(billingPeriod);
  const modeLabel = billingMode === 'recurring' ? 'assinatura recorrente' : 'pagamento único';
  const periodLabel = billingPeriod === 'annual' ? 'anual' : 'mensal';
  return `Plano ${plan.nome} Profissional (${periodLabel}, ${modeLabel}) - Recruta Indústria (${days} dias)`;
}
