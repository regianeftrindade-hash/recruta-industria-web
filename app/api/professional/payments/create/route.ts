import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth.config';

import { prisma } from '@/lib/db';

import {

  createPagSeguroPayment,

  getPagSeguroConfig,

  type PagSeguroPaymentMethod,

} from '@/lib/pagseguro-client';

import { createPagBankRecurringSubscription } from '@/lib/pagseguro-subscriptions';

import { buildProfessionalPaymentDescription } from '@/lib/professional-payment';

import {

  getPaidProfessionalPlanTiers,

  getProfessionalPlanDefinition,

  type ProfessionalPlanTier,

} from '@/lib/professional-premium-plans';

import { isPaymentGatewayConfigured, isSandboxMode } from '@/lib/payment-config';

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

          detail: 'Defina PAGSEGURO_TOKEN no .env.local',

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

    const method = (body?.method || 'pix') as PagSeguroPaymentMethod;



    if (!getPaidProfessionalPlanTiers().includes(planTier)) {

      return NextResponse.json({ error: 'Plano inválido para cobrança' }, { status: 400 });

    }



    const planDef = getProfessionalPlanDefinition(planTier);

    const amount = getPlanPriceCentavos(planDef.precoCentavos, billingPeriod);

    const name = String(user.name || user.profile.title || 'Profissional').trim();

    const email = user.email.toLowerCase().trim();

    const taxId =

      sanitizeTaxId(user.profile.cpf)

      ?? (isSandboxMode() ? fallbackTaxIdForSandbox() : undefined);



    if (!taxId) {

      return NextResponse.json(

        { error: 'Cadastre seu CPF no perfil antes de pagar.' },

        { status: 400 },

      );

    }



    const description = buildProfessionalPaymentDescription(planTier, billingPeriod, billingMode);



    if (billingMode === 'recurring') {

      const subscription = await createPagBankRecurringSubscription({

        planReference: `pro-${planTier}-${billingPeriod}`.toLowerCase(),

        planName: `${planDef.nome} Profissional`,

        description,

        amountCentavos: amount,

        billingPeriod,

        customer: {

          name,

          email,

          taxId,

          phone: user.profile.whatsapp || user.profile.telefone2 || undefined,

        },

        subscriptionReference: `pro-${user.id}-${Date.now()}`,

        paymentMethod: 'boleto',

      });



      const meta = {

        type: 'professional_subscription',

        planTier,

        professionalUserId: user.id,

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



    const payment = await createPagSeguroPayment({

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



    const { apiUrl } = getPagSeguroConfig();



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

      sandbox: apiUrl.includes('sandbox'),

    });

  } catch (error) {

    console.error('Erro professional payments/create:', error);

    const message = error instanceof Error ? error.message : 'Erro inesperado';

    const status = message.includes('não configurado') ? 503 : 502;

    return NextResponse.json({ error: message }, { status });

  }

}

