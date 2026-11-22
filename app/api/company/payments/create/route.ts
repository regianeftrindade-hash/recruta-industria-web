import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/db';
import {
  createGatewayPayment,
  getGatewayApiUrl,
  type GatewayPaymentMethod,
} from '@/lib/payment/gateway';
import { buildCompanyPaymentDescription } from '@/lib/company-payment';
import {
  getPaidPlanTiers,
  getPlanDefinition,
  type CompanyPlanTier,
} from '@/lib/company-premium-plans';
import {
  isPaymentGatewayConfiguredForCountry,
  isSandboxMode,
  resolvePaymentProvider,
} from '@/lib/payment-config';
import { getCompanyExtraData } from '@/lib/company-storage';
import { sanitizeTaxId, fallbackTaxIdForSandbox } from '@/lib/payment-tax';
import {
  getPlanPriceCentavos,
  parseBillingMode,
  parseBillingPeriod,
} from '@/lib/billing';
import {
  createStripeCheckoutSession,
  getStripePriceId,
  resolveCompanyStripePriceKey,
  isStripeEnabled,
  listMissingStripePriceEnvs,
  envNameForStripePriceKey,
} from '@/lib/payment/stripe-client';
import { billingCountryFromProfile } from '@/lib/payment/market';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { company: true },
    });

    if (!user || user.role !== 'COMPANY' || !user.company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 403 });
    }

    const billingCountry = billingCountryFromProfile(user.countryCode);
    const provider = resolvePaymentProvider(billingCountry);

    if (!provider || !isPaymentGatewayConfiguredForCountry(billingCountry)) {
      if (billingCountry !== 'BR') {
        return NextResponse.json(
          {
            error: 'Pagamentos internacionais temporariamente indisponíveis',
            detail:
              'Configure STRIPE_SECRET_KEY e os Price IDs no ambiente, ou aguarde a liberação do checkout internacional.',
            missingPriceEnvs: listMissingStripePriceEnvs(),
            provider: null,
            billingCountry,
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        {
          error: 'Gateway de pagamento não configurado',
          detail: 'Defina ASAAS_API_KEY no ambiente (sandbox: https://api-sandbox.asaas.com)',
        },
        { status: 503 },
      );
    }

    if (billingCountry === 'BR' && provider === 'stripe') {
      return NextResponse.json(
        { error: 'Clientes do Brasil devem usar Asaas', billingCountry },
        { status: 400 },
      );
    }

    const body = await req.json();
    const planTier = String(body?.planTier || '').toUpperCase() as CompanyPlanTier;
    const billingPeriod = parseBillingPeriod(body?.billingPeriod);
    const billingMode = parseBillingMode(body?.billingMode);
    const method = (body?.method || 'pix') as GatewayPaymentMethod;

    if (!getPaidPlanTiers().includes(planTier)) {
      return NextResponse.json({ error: 'Plano inválido para cobrança' }, { status: 400 });
    }

    const planDef = getPlanDefinition(planTier);
    const amount = getPlanPriceCentavos(planDef.precoCentavos, billingPeriod);
    const name = String(user.company.name || user.name || 'Empresa').trim();
    const email = user.email.toLowerCase().trim();
    const description = buildCompanyPaymentDescription(planTier, billingPeriod, billingMode);

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

      const priceKey = resolveCompanyStripePriceKey(planTier, billingPeriod);
      const priceId = priceKey ? getStripePriceId(priceKey) : null;
      if (!priceId) {
        return NextResponse.json(
          {
            error: 'Preço internacional não configurado para este plano',
            detail:
              'Cadastre o produto no Stripe Dashboard e defina a variável de ambiente do Price ID correspondente.',
            planTier,
            billingPeriod,
            requiredEnv: priceKey ? envNameForStripePriceKey(priceKey) : null,
            missingPriceEnvs: listMissingStripePriceEnvs(),
          },
          { status: 503 },
        );
      }

      const baseUrl = (process.env.NEXTAUTH_URL || 'https://www.recrutaindustria.com').replace(/\/$/, '');
      const paymentReference = `stripe_co_${user.id}_${Date.now()}`;

      const meta = {
        type: 'company_subscription' as const,
        planTier,
        companyUserId: user.id,
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

      const checkout = await createStripeCheckoutSession({
        priceId,
        customerEmail: email,
        customerName: name,
        mode: 'subscription',
        successUrl: `${baseUrl}/company/pagamento?success=1&ref=${encodeURIComponent(paymentReference)}`,
        cancelUrl: `${baseUrl}/company/pagamento?canceled=1`,
        clientReferenceId: paymentReference,
        metadata: {
          paymentReference,
          type: 'company_subscription',
          planTier,
          companyUserId: user.id,
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

    // Asaas (Brasil) — exclusivas novas cobranças BR
    const extra = await getCompanyExtraData(user.id);
    const taxId =
      sanitizeTaxId(extra.cnpj) ?? (isSandboxMode() ? fallbackTaxIdForSandbox() : undefined);

    if (!taxId) {
      return NextResponse.json(
        { error: 'Cadastre o CNPJ da empresa antes de pagar.' },
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

    const payment = await createGatewayPayment({
      amount,
      method,
      customer: { name, email, taxId },
      description,
      itemReference: `company-plan-${planTier}-${billingPeriod}`,
    });

    const meta = {
      type: 'company_subscription',
      planTier,
      companyUserId: user.id,
      expectedAmount: amount,
      billingPeriod,
      billingMode,
      provider: payment.provider,
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

    const apiUrl = getGatewayApiUrl();

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
      billingMode,
      recurring: false,
      provider: payment.provider,
      billingCountry: 'BR',
      sandbox: apiUrl.includes('sandbox'),
    });
  } catch (error) {
    console.error('Erro company payments/create:', error);
    const message = error instanceof Error ? error.message : 'Erro inesperado';
    const status =
      message.includes('não configurado') || message.includes('não configurada') ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
