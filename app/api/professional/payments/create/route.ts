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
import { billingCountryFromProfile } from '@/lib/payment/market';
import { resolvePaymentProvider } from '@/lib/payment-config';
import {
  createStripeCheckoutSession,
  getStripePriceId,
  isStripeEnabled,
  listMissingStripePriceEnvs,
  resolveProfessionalStripePriceKey,
  envNameForStripePriceKey,
} from '@/lib/payment/stripe-client';
import {
  resolveCheckoutBaseUrl,
  stripeCheckoutReturnUrls,
} from '@/lib/payment/checkout-return-url';

import { apiUnauthorizedResponse } from "@/lib/i18n/api-response";

export async function POST(req: NextRequest) {
  try {
    if (!isProfessionalPremiumOfferingEnabled()) {
      return NextResponse.json(
        { error: 'O plano Premium profissional não está disponível para novas contratações.' },
        { status: 403 },
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return await apiUnauthorizedResponse();
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { profile: true },
    });

    if (!user || user.role !== 'PROFESSIONAL' || !user.profile) {
      return NextResponse.json({ error: 'Perfil profissional não encontrado' }, { status: 403 });
    }

    const billingCountry = billingCountryFromProfile(user.countryCode);
    const provider = resolvePaymentProvider(billingCountry);

    const body = await req.json();
    const planTier = String(body?.planTier || 'PREMIUM').toUpperCase() as ProfessionalPlanTier;
    const billingPeriod = parseBillingPeriod(body?.billingPeriod);
    const billingMode = parseBillingMode(body?.billingMode);
    const method = String(body?.method || 'pix') as AsaasPaymentMethod;

    if (!getPaidProfessionalPlanTiers().includes(planTier)) {
      return NextResponse.json({ error: 'Plano inválido para cobrança' }, { status: 400 });
    }

    const planDef = getProfessionalPlanDefinition(planTier);
    const amount = getPlanPriceCentavos(planDef.precoCentavos, billingPeriod);
    const name = String(user.name || user.profile.title || 'Profissional').trim();
    const email = user.email.toLowerCase().trim();

    if (provider === 'stripe') {
      if (!isStripeEnabled()) {
        return NextResponse.json(
          {
            error: 'Pagamentos internacionais temporariamente indisponíveis',
            detail: 'STRIPE_SECRET_KEY não configurada.',
          },
          { status: 503 },
        );
      }

      const priceKey = resolveProfessionalStripePriceKey(planTier, billingPeriod);
      const priceId = priceKey ? getStripePriceId(priceKey) : null;
      if (!priceId) {
        return NextResponse.json(
          {
            error: 'Preço internacional não configurado para este plano',
            detail:
              'Cadastre o produto no Stripe Dashboard e defina o Price ID anual/mensal correspondente.',
            requiredEnv: priceKey ? envNameForStripePriceKey(priceKey) : null,
            missingPriceEnvs: listMissingStripePriceEnvs(),
          },
          { status: 503 },
        );
      }

      const baseUrl = resolveCheckoutBaseUrl();
      const paymentReference = `stripe_pro_${user.id}_${Date.now()}`;

      const meta = {
        type: 'professional_subscription' as const,
        planTier,
        professionalUserId: user.id,
        expectedAmount: amount,
        billingPeriod,
        billingMode: 'recurring' as const,
        provider: 'stripe' as const,
        stripePriceId: priceId,
        billingCountry,
      };

      await prisma.paymentRecord.create({
        data: {
          reference: paymentReference,
          amount,
          currency: 'USD',
          method: 'card',
          customer: JSON.stringify({ name, email, country: billingCountry }),
          status: 'PENDING',
          meta: JSON.stringify(meta),
        },
      });

      const { successUrl, cancelUrl } = stripeCheckoutReturnUrls({
        baseUrl,
        successPath: '/professional/pagamento',
        cancelPath: '/professional/pagamento',
        paymentReference,
      });

      const checkout = await createStripeCheckoutSession({
        priceId,
        customerEmail: email,
        customerName: name,
        mode: 'subscription',
        successUrl,
        cancelUrl,
        clientReferenceId: paymentReference,
        metadata: {
          paymentReference,
          type: 'professional_subscription',
          planTier,
          professionalUserId: user.id,
          billingCountry,
          billingPeriod,
        },
        idempotencyKey: paymentReference,
      });

      await prisma.paymentRecord.update({
        where: { reference: paymentReference },
        data: { externalId: checkout.sessionId },
      });

      return NextResponse.json({
        chargeId: paymentReference,
        sessionId: checkout.sessionId,
        checkoutUrl: checkout.url,
        status: 'PENDING',
        planTier,
        amount,
        billingPeriod,
        billingMode: 'recurring',
        recurring: true,
        provider: 'stripe',
        billingCountry,
        adaptivePricing: checkout.adaptivePricing,
        referenceCurrency: 'USD',
        sandbox: (process.env.STRIPE_SECRET_KEY || '').includes('_test_'),
      });
    }

    if (billingCountry !== 'BR' || provider !== 'asaas') {
      return NextResponse.json(
        {
          error: 'Pagamentos internacionais temporariamente indisponíveis',
          detail: 'Stripe não configurado para este país de faturamento.',
          billingCountry,
          missingPriceEnvs: listMissingStripePriceEnvs(),
        },
        { status: 503 },
      );
    }

    const { apiKey, apiUrl } = getAsaasConfig();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Gateway de pagamento não configurado',
          detail:
            'A cobrança profissional usa a mesma ASAAS_API_KEY da cobrança empresarial. Ela não está definida neste ambiente.',
        },
        { status: 503 },
      );
    }

    const taxId =
      sanitizeTaxId(user.profile.cpf) ??
      (apiUrl.includes('sandbox') ? fallbackTaxIdForSandbox() : undefined);

    if (!taxId) {
      return NextResponse.json(
        { error: 'Cadastre o CPF no perfil antes de pagar.' },
        { status: 400 },
      );
    }

    if (billingMode === 'recurring') {
      return NextResponse.json(
        {
          error: 'Assinatura recorrente indisponível no momento',
          detail: 'Use pagamento único (Pix ou Boleto) via Asaas.',
        },
        { status: 400 },
      );
    }

    if (!['pix', 'boleto'].includes(method)) {
      return NextResponse.json(
        { error: 'Use Pix ou Boleto para pagamento único.' },
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
      billingMode: 'one_time',
      provider: 'asaas',
      billingCountry: 'BR',
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

    const sandbox = apiUrl.includes('sandbox');

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
      billingCountry: 'BR',
      sandbox,
    });
  } catch (error) {
    console.error('Erro professional payments/create:', error);
    const message = error instanceof Error ? error.message : 'Erro inesperado';
    const status =
      message.includes('não configurada') || message.includes('não configurado') ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
