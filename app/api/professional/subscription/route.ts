import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/db';
import { setProfessionalPlanTier } from '@/lib/professional-storage';
import { getProfessionalPlanContext } from '@/lib/professional-plan';
import { activateProfessionalPlanFromPayment } from '@/lib/professional-payment';
import {
  getPaidProfessionalPlanTiers,
  getProfessionalPlanDefinition,
  type ProfessionalPlanTier,
} from '@/lib/professional-premium-plans';
import { getProfessionalSubscriptionBilling } from '@/lib/subscription-billing-storage';
import { ensurePaymentSchema } from '@/lib/ensure-db-schema';

export async function GET() {
  await ensurePaymentSchema();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase().trim() },
  });

  if (!user || user.role !== 'PROFESSIONAL') {
    return NextResponse.json({ error: 'Acesso restrito a profissionais' }, { status: 403 });
  }

  const planContext = await getProfessionalPlanContext(user.id);
  const billing = await getProfessionalSubscriptionBilling(user.id);
  return NextResponse.json({
    currentTier: planContext.tier,
    isPremium: planContext.isPremium,
    subscriptionExpiresAt: planContext.subscriptionExpiresAt?.toISOString() ?? null,
    billingPeriod: billing?.billingPeriod ?? 'monthly',
    billingMode: billing?.billingMode ?? 'one_time',
    autoRenew: billing?.autoRenew ?? false,
    gatewaySubscriptionId: billing?.gatewaySubscriptionId ?? null,
    plan: planContext.plan,
    features: planContext.features,
  });
}

export async function POST(request: NextRequest) {
  try {
    await ensurePaymentSchema();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { profile: true },
    });

    if (!user || user.role !== 'PROFESSIONAL' || !user.profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const planTier = body.planTier as ProfessionalPlanTier;
    const chargeId = String(body.chargeId || '').trim();

    if (planTier === 'FREE') {
      await setProfessionalPlanTier(user.id, 'FREE');
      const planContext = await getProfessionalPlanContext(user.id);
      return NextResponse.json({ success: true, plan: planContext });
    }

    if (!getPaidProfessionalPlanTiers().includes(planTier)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    if (!chargeId) {
      return NextResponse.json(
        { error: 'chargeId é obrigatório para ativar plano pago' },
        { status: 400 },
      );
    }

    const { alreadyActive } = await activateProfessionalPlanFromPayment(
      user.id,
      chargeId,
      planTier,
    );

    const planContext = await getProfessionalPlanContext(user.id);
    const planDef = getProfessionalPlanDefinition(planTier);

    return NextResponse.json({
      success: true,
      alreadyActive,
      message: alreadyActive
        ? `Plano ${planDef.nome} já estava ativo.`
        : `Plano ${planDef.nome} ativado com sucesso.`,
      plan: planContext,
    });
  } catch (error) {
    console.error('Erro ao ativar assinatura profissional:', error);
    const message = error instanceof Error ? error.message : 'Erro ao ativar assinatura';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
