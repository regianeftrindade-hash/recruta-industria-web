import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { getCompanyExtraData } from '@/lib/company-storage'
import { formatCPF, formatCNPJ } from '@/lib/security'
import { getCompanyPlanContext } from '@/lib/company-plan'
import { getPlanDefinition } from '@/lib/company-premium-plans'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { company: true },
    })

    if (!user || !user.company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const extra = await getCompanyExtraData(user.id)
    const planContext = await getCompanyPlanContext(user.id)
    const planDef = getPlanDefinition(planContext.tier)

    return NextResponse.json({
      company: {
        id: user.company.id,
        razaoSocial: user.company.name,
        cnpj: extra.cnpj ? formatCNPJ(extra.cnpj) : null,
        responsavelNome: extra.responsavelNome,
        responsavelCpf: extra.responsavelCpf ? formatCPF(extra.responsavelCpf) : null,
        email: user.email,
      },
      plan: {
        tier: planContext.tier,
        nome: planDef.nome,
        preco: planDef.preco,
        features: planContext.features,
        usage: planContext.usage,
      },
      unlockedCount: planContext.usage.activeUnlocks,
      maxUnlocks: planContext.features.unlimitedUnlocks
        ? null
        : planContext.features.maxUnlocksPerMonth,
      slotsRestantes: planContext.usage.unlocksRemaining,
    })
  } catch (error) {
    console.error('Erro ao buscar perfil da empresa:', error)
    return NextResponse.json({ error: 'Erro ao buscar perfil da empresa' }, { status: 500 })
  }
}
