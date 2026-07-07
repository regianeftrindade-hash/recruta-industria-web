import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth.config'

import { prisma } from '@/lib/db'

import { setCompanyPlanTier } from '@/lib/company-storage'

import type { CompanyPlanTier } from '@/lib/company-premium-plans'

import { getPlanDefinition, getPaidPlanTiers } from '@/lib/company-premium-plans'

import { getCompanyPlanContext } from '@/lib/company-plan'

import { activateCompanyPlanFromPayment } from '@/lib/company-payment'



import { getCompanySubscriptionBilling } from '@/lib/subscription-billing-storage'
import { ensurePaymentSchema } from '@/lib/ensure-db-schema'

export async function GET() {
  await ensurePaymentSchema();

  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {

    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  }



  const user = await prisma.user.findUnique({

    where: { email: session.user.email.toLowerCase().trim() },

  })



  if (!user || user.role !== 'COMPANY') {

    return NextResponse.json({ error: 'Acesso restrito a empresas' }, { status: 403 })

  }



  const planContext = await getCompanyPlanContext(user.id)
  const billing = await getCompanySubscriptionBilling(user.id)

  return NextResponse.json({
    currentTier: planContext.tier,
    subscriptionExpiresAt: billing?.subscriptionExpiresAt?.toISOString() ?? null,
    billingPeriod: billing?.billingPeriod ?? 'monthly',
    billingMode: billing?.billingMode ?? 'one_time',
    autoRenew: billing?.autoRenew ?? false,
    gatewaySubscriptionId: billing?.gatewaySubscriptionId ?? null,
    usage: planContext.usage,
    features: planContext.features,
  })

}



export async function POST(request: NextRequest) {
  try {
    await ensurePaymentSchema();

    const session = await getServerSession(authOptions)



    if (!session?.user?.email) {

      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    }



    const user = await prisma.user.findUnique({

      where: { email: session.user.email.toLowerCase().trim() },

      include: { company: true },

    })



    if (!user || user.role !== 'COMPANY' || !user.company) {

      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })

    }



    const body = await request.json()

    const planTier = body.planTier as CompanyPlanTier

    const chargeId = String(body.chargeId || '').trim()



    if (planTier === 'FREE') {

      await setCompanyPlanTier(user.id, 'FREE')

      const planContext = await getCompanyPlanContext(user.id)

      return NextResponse.json({ success: true, plan: planContext })

    }



    if (!getPaidPlanTiers().includes(planTier)) {

      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })

    }



    if (!chargeId) {

      return NextResponse.json(

        { error: 'chargeId é obrigatório para ativar plano pago' },

        { status: 400 }

      )

    }



    const { alreadyActive } = await activateCompanyPlanFromPayment(

      user.id,

      chargeId,

      planTier

    )



    const planContext = await getCompanyPlanContext(user.id)

    const planDef = getPlanDefinition(planTier)



    return NextResponse.json({

      success: true,

      alreadyActive,

      message: alreadyActive

        ? `Plano ${planDef.nome} já estava ativo.`

        : `Plano ${planDef.nome} ativado com sucesso.`,

      plan: planContext,

    })

  } catch (error) {

    console.error('Erro ao ativar assinatura:', error)

    const message = error instanceof Error ? error.message : 'Erro ao ativar assinatura'

    return NextResponse.json({ error: message }, { status: 400 })

  }

}

