import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/db';
import { createAsaasPayment, getAsaasConfig, type AsaasPaymentMethod } from '@/lib/payment/asaas-client';
import { buildProfessionalPaymentDescription } from '@/lib/professional-payment';
import {
  getPaidProfessionalPlanTiers,
  getProfessionalPlanDefinition,
  type ProfessionalPlanTier,
} from '@/lib/professional-premium-plans';
import { sanitizeTaxId, fallbackTaxIdForSandbox } from '@/lib/payment-tax';
import {
  getPlanPriceCentavos,
  parseBillingMode,
  parseBillingPeriod,
} from '@/lib/billing';
import { isProfessionalPremiumOfferingEnabled } from '@/lib/professional/premium-offering';

export async function POST(req: NextRequest) {
  try {
    if (!isProfessionalPremiumOfferingEnabled()) {
      return NextResponse.json(
        { error: 'O plano Premium profissional não está disponível para novas contratações.' },
        { status: 403 },
      );
    }

    const { apiKey, apiUrl } = getAsaasConfig();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Gateway de pagamento não configurado',
          detail: 'A cobrança profissional usa a mesma ASAAS_API_KEY da cobrança empresarial. Ela não está definida neste ambiente.',
        },
        { status: 503 },
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { profile: true },
    });

    if (!user || user.role !== 'PROFESSIONAL' || !user.profile) {
      return NextResponse.json({ error: 'Perfil profissional não encontrado' }, { status: 403 });
    }

    const body = await req.json();
    const planTier = String(body?.planTier || 'PREMIUM').toUpperCase() as ProfessionalPlanTier;
    const billingPeriod = parseBillingPeriod(body?.billingPeriod);
    const billingMode = parseBillingMode(body?.billingMode);
    const method = String(body?.method || 'pix') as AsaasPaymentMethod;

    if (!getPaidProfessionalPlanTiers().includes(planTier)) {
      return NextResponse.json({ error: 'Plano inválido para cobrança' }, { status: 400 });
    }

    if (billingMode === 'recurring') {
      return NextResponse.json(
        {
          error: 'O Premium profissional é cobrado no Asaas por Pix ou Boleto.',
          detail: 'A assinatura recorrente do PagBank não é usada nesta contratação.',
        },
        { status: 400 },
      );
    }

    if (!['pix', 'boleto'].includes(method)) {
      return NextResponse.json(
        { error: 'Use Pix ou Boleto para o Premium profissional.' },
        { status: 400 },
      );
    }

    const planDef = getProfessionalPlanDefinition(planTier);
    const amount = getPlanPriceCentavos(planDef.precoCentavos, billingPeriod);
    const name = String(user.name || user.profile.title || 'Profissional').trim();
    const email = user.email.toLowerCase().trim();
    const sandbox = apiUrl.includes('sandbox');
    const taxId = sanitizeTaxId(user.profile.cpf) ?? (sandbox ? fallbackTaxIdForSandbox() : undefined);

    if (!taxId) {
      return NextResponse.json(
        { error: 'Cadastre seu CPF no perfil antes de pagar.' },
        { status: 400 },
      );
    }

    const description = buildProfessionalPaymentDescription(planTier, billingPeriod, 'one_time');
    const payment = await createAsaasPayment({
      amount,
      method,
      customer: { name, email, taxId },
      description,
      itemReference: `professional-plan-${planTier}-${billingPeriod}`,
    });

    const meta = {
      type: 'professional_subscription',
      planTier,
      professionalUserId: user.id,
      expectedAmount: amount,
      billingPeriod,
      billingMode: 'one_time' as const,
      provider: 'asaas' as const,
    };

    await prisma.paymentRecord.create({
      data: {
        reference: payment.chargeId,
        amount,
        currency: 'BRL',
        method,
        customer: JSON.stringify({ name, email }),
        status: payment.status,
        meta: JSON.stringify(meta),
        externalId: payment.orderId,
      },
    });

    return NextResponse.json({
      chargeId: payment.chargeId,
      copyPasteKey: payment.copyPasteKey,
      qrCodeDataUrl: payment.qrCodeDataUrl,
      boletoUrl: payment.boletoUrl,
      line: payment.line,
      checkoutUrl: payment.checkoutUrl,
      expiresAt: payment.expiresAt,
      status: payment.status,
      planTier,
      amount,
      billingPeriod,
      billingMode: 'one_time',
      recurring: false,
      provider: 'asaas',
      sandbox,
    });
  } catch (error) {
    console.error('Erro professional payments/create:', error);
    const message = error instanceof Error ? error.message : 'Erro inesperado';
    const status = message.includes('não configurada') || message.includes('não configurado') ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
