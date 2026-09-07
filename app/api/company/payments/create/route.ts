import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth.config';

import { prisma } from '@/lib/db';

import {

  createGatewayPayment,

  getGatewayApiUrl,

  isRecurringGatewaySupported,

  type GatewayPaymentMethod,

} from '@/lib/payment/gateway';

import { createPagBankRecurringSubscription } from '@/lib/pagseguro-subscriptions';
import { getPagSeguroConfig } from '@/lib/pagseguro-client';

import { buildCompanyPaymentDescription } from '@/lib/company-payment';

import {

  getPaidPlanTiers,

  getPlanDefinition,

  type CompanyPlanTier,

} from '@/lib/company-premium-plans';

import { isPaymentGatewayConfigured, isSandboxMode, getPaymentProvider } from '@/lib/payment-config';

import { getCompanyExtraData } from '@/lib/company-storage';

import { sanitizeTaxId, fallbackTaxIdForSandbox } from '@/lib/payment-tax';

import {

  getPlanPriceCentavos,

  parseBillingMode,

  parseBillingPeriod,

} from '@/lib/billing';



export async function POST(req: NextRequest) {

  try {

    if (!isPaymentGatewayConfigured()) {

      return NextResponse.json(

        {

          error: 'Gateway de pagamento não configurado',

          detail: getPaymentProvider() === 'asaas'
            ? 'Defina ASAAS_API_KEY no .env.local (sandbox: https://api-sandbox.asaas.com)'
            : 'Defina PAGSEGURO_TOKEN no .env.local (sandbox: https://sandbox.api.pagseguro.com)',

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

      include: { company: true },

    });



    if (!user || user.role !== 'COMPANY' || !user.company) {

      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 403 });

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

    const extra = await getCompanyExtraData(user.id);

    const taxId =

      sanitizeTaxId(extra.cnpj)

      ?? (isSandboxMode() ? fallbackTaxIdForSandbox() : undefined);



    if (!taxId) {

      return NextResponse.json(

        { error: 'Cadastre o CNPJ da empresa antes de pagar.' },

        { status: 400 },

      );

    }



    const description = buildCompanyPaymentDescription(planTier, billingPeriod, billingMode);



    if (billingMode === 'recurring') {
      if (!isRecurringGatewaySupported()) {
        return NextResponse.json(
          {
            error: 'Assinatura recorrente indisponível com Asaas',
            detail: 'Use pagamento único (Pix ou Boleto) ou configure PAYMENT_PROVIDER=pagseguro.',
          },
          { status: 400 },
        );
      }

      const subscription = await createPagBankRecurringSubscription({

        planReference: `company-${planTier}-${billingPeriod}`.toLowerCase(),

        planName: `${planDef.nome} Empresa`,

        description,

        amountCentavos: amount,

        billingPeriod,

        customer: { name, email, taxId },

        subscriptionReference: `company-${user.id}-${Date.now()}`,

        paymentMethod: 'boleto',

      });



      const meta = {

        type: 'company_subscription',

        planTier,

        companyUserId: user.id,

        expectedAmount: amount,

        billingPeriod,

        billingMode,

        gatewaySubscriptionId: subscription.subscriptionId,

      };



      await prisma.paymentRecord.create({

        data: {

          reference: subscription.subscriptionId,

          amount,

          currency: 'BRL',

          method: 'boleto',

          customer: JSON.stringify({ name, email }),

          status: subscription.status === 'ACTIVE' ? 'PAID' : 'PENDING',

          meta: JSON.stringify(meta),

          externalId: subscription.subscriptionId,

        },

      });



      const { apiUrl } = getPagSeguroConfig();

      return NextResponse.json({

        chargeId: subscription.subscriptionId,

        boletoUrl: subscription.boletoUrl,

        checkoutUrl: subscription.checkoutUrl,

        status: subscription.status === 'ACTIVE' ? 'PAID' : 'PENDING',

        planTier,

        amount,

        billingPeriod,

        billingMode,

        recurring: true,

        sandbox: apiUrl.includes('sandbox'),

      });

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

      sandbox: apiUrl.includes('sandbox'),

    });

  } catch (error) {

    console.error('Erro company payments/create:', error);

    const message = error instanceof Error ? error.message : 'Erro inesperado';

    const status = message.includes('não configurado') ? 503 : 502;

    return NextResponse.json({ error: message }, { status });

  }

}

