import { prisma } from '@/lib/db';
import {
  asCompanyExtraSeatsPaymentMeta,
  asCompanyPaymentMeta,
  asProfessionalPaymentMeta,
} from '@/lib/payment/payment-config';
import {
  activateCompanyExtraSeatsFromPayment,
  activateCompanyPlanFromPayment,
} from '@/lib/payment/company-payment';
import { activateProfessionalPlanFromPayment } from '@/lib/payment/professional-payment';
import { getPagSeguroChargeStatus } from '@/lib/pagseguro-client';
import { getAsaasChargeStatus } from '@/lib/payment/asaas-client';
import {
  getPagBankSubscriptionStatus,
  isPagBankSubscriptionId,
} from '@/lib/pagseguro-subscriptions';
import {
  isStripeReference,
  mapStripePaymentStatus,
  retrieveStripeCheckoutSession,
} from '@/lib/payment/stripe-client';
import type { CompanyPlanTier } from '@/lib/company-premium-plans';
import type { ProfessionalPlanTier } from '@/lib/professional-premium-plans';

export function paymentBelongsToUser(
  meta: string | null | undefined,
  userId: string,
): boolean {
  const company = asCompanyPaymentMeta(meta);
  if (company) return company.companyUserId === userId;

  const extraSeats = asCompanyExtraSeatsPaymentMeta(meta);
  if (extraSeats) return extraSeats.companyUserId === userId;

  const professional = asProfessionalPaymentMeta(meta);
  if (professional) return professional.professionalUserId === userId;

  return false;
}

export async function activatePaidPayment(
  paymentReference: string,
): Promise<{ activated: boolean; alreadyActive?: boolean; type?: string }> {
  const payment = await prisma.paymentRecord.findUnique({
    where: { reference: paymentReference },
  });

  if (!payment || payment.status !== 'PAID') {
    return { activated: false };
  }

  const companyMeta = asCompanyPaymentMeta(payment.meta);
  if (companyMeta) {
    try {
      const { alreadyActive } = await activateCompanyPlanFromPayment(
        companyMeta.companyUserId,
        paymentReference,
        companyMeta.planTier as CompanyPlanTier,
      );
      return { activated: true, alreadyActive, type: 'company' };
    } catch (error) {
      console.error('[pagamento] falha ao ativar plano empresa:', error);
      return { activated: false };
    }
  }

  const extraSeatsMeta = asCompanyExtraSeatsPaymentMeta(payment.meta);
  if (extraSeatsMeta) {
    try {
      const { alreadyActive } = await activateCompanyExtraSeatsFromPayment(
        extraSeatsMeta.companyUserId,
        paymentReference,
      );
      return { activated: true, alreadyActive, type: 'company_extra_seats' };
    } catch (error) {
      console.error('[pagamento] falha ao ativar usuário extra:', error);
      return { activated: false };
    }
  }

  const professionalMeta = asProfessionalPaymentMeta(payment.meta);
  if (professionalMeta) {
    try {
      const { alreadyActive } = await activateProfessionalPlanFromPayment(
        professionalMeta.professionalUserId,
        paymentReference,
        professionalMeta.planTier as ProfessionalPlanTier,
      );
      return { activated: true, alreadyActive, type: 'professional' };
    } catch (error) {
      console.error('[pagamento] falha ao ativar plano profissional:', error);
      return { activated: false };
    }
  }

  return { activated: false };
}

export async function syncPaymentStatusFromGateway(
  paymentReference: string,
): Promise<{ status: string; activated: boolean }> {
  const rec = await prisma.paymentRecord.findUnique({
    where: { reference: paymentReference },
  });

  if (!rec) {
    throw new Error('Cobrança não encontrada');
  }

  let status = rec.status;

  if (isStripeReference(paymentReference) || paymentReference.startsWith('cs_') || paymentReference.startsWith('sub_')) {
    try {
      const session = await retrieveStripeCheckoutSession(paymentReference);
      status = mapStripePaymentStatus(session.payment_status, session.status);
    } catch {
      // keep current status
    }
  } else if (isPagBankSubscriptionId(paymentReference)) {
    const remote = await getPagBankSubscriptionStatus(paymentReference);
    if (remote && typeof remote.status === 'string') {
      status = remote.status;
    }
  } else if (paymentReference.startsWith('pay_')) {
    const remote = await getAsaasChargeStatus(paymentReference);
    if (remote && typeof remote.status === 'string') {
      status = remote.status;
    }
  } else {
    const remote = await getPagSeguroChargeStatus(paymentReference);
    if (remote && typeof (remote as { status?: string }).status === 'string') {
      status = (remote as { status: string }).status;
    }
  }

  if (rec.status !== status) {
    await prisma.paymentRecord.update({
      where: { id: rec.id },
      data: { status },
    });
  }

  let activated = false;
  if (status === 'PAID') {
    const result = await activatePaidPayment(paymentReference);
    activated = result.activated;
  }

  return { status, activated };
}

export async function findPaymentRecordByGatewayRef(ref: string) {
  let payment = await prisma.paymentRecord.findFirst({
    where: { OR: [{ reference: ref }, { externalId: ref }] },
  });

  if (!payment && ref.startsWith('pay_')) {
    payment = await prisma.paymentRecord.findFirst({
      where: { OR: [{ reference: ref }, { externalId: ref }] },
    });
  }

  if (!payment && ref.startsWith('SUBS_')) {
    payment = await prisma.paymentRecord.findFirst({
      where: { OR: [{ reference: ref }, { externalId: ref }] },
    });
  }

  if (!payment && (ref.startsWith('cs_') || ref.startsWith('sub_') || ref.startsWith('in_') || ref.startsWith('pi_'))) {
    payment = await prisma.paymentRecord.findFirst({
      where: { OR: [{ reference: ref }, { externalId: ref }] },
    });
  }

  return payment;
}
