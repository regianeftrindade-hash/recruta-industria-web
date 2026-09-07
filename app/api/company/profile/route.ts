import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import {
  getCompanyExtraData,
  getCompanyVerificationInfo,
  loadCompanyRowByUserId,
} from '@/lib/company-storage'
import { ensureCompanyTestBypassReady, matchesCompanyTestBypass } from '@/lib/company/company-test-bypass'
import { formatCPF, formatCNPJ } from '@/lib/security'
import { getCompanyPlanContext, getPlanFeatures } from '@/lib/company-plan'
import { getPlanDefinition } from '@/lib/company-premium-plans'
import { resolveCompanyActor } from '@/lib/company/company-team'
import { ensureUserLastSeenColumn } from '@/lib/ensure-db-schema'

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
} as const

export async function GET() {
  try {
    await ensureUserLastSeenColumn()
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const email = session.user.email.toLowerCase().trim()
    let user = await prisma.user.findUnique({
      where: { email },
      select: userSelect,
    })

    if (!user) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    let company = await loadCompanyRowByUserId(user.id)

    if (
      matchesCompanyTestBypass({
        email: user.email,
        companyName: company?.name,
        userName: user.name,
      })
    ) {
      await ensureCompanyTestBypassReady(user.id)
      user = await prisma.user.findUnique({
        where: { id: user.id },
        select: userSelect,
      })
      if (!user) {
        return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
      }
      company = await loadCompanyRowByUserId(user.id)
    }

    const actor = await resolveCompanyActor(user.id).catch(() => null)
    const ownerUserId = actor?.ownerUserId || user.id

    if (ownerUserId !== user.id) {
      company = await loadCompanyRowByUserId(ownerUserId)
    }

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const extra = await getCompanyExtraData(ownerUserId)
    const verification = await getCompanyVerificationInfo(ownerUserId, extra)
    let planContext
    try {
      planContext = await getCompanyPlanContext(user.id, {
        ownerUserId,
        verification,
      })
    } catch (error) {
      console.error('[company/profile] plano falhou, usando FREE:', error)
      const freeFeatures = getPlanFeatures('FREE')
      planContext = {
        tier: 'FREE' as const,
        features: freeFeatures,
        usage: {
          activeUnlocks: 0,
          unlocksRemaining: freeFeatures.maxUnlocksPerMonth,
        },
      }
    }
    const planDef = getPlanDefinition(planContext.tier)

    const companyLogo = extra.logoUrl || company.logoUrl || null
    const companyFoto = extra.fotoResponsavelUrl || company.fotoResponsavelUrl || null

    return NextResponse.json({
      company: {
        id: company.id,
        razaoSocial: company.name,
        cnpj: extra.cnpj ? formatCNPJ(extra.cnpj) : null,
        responsavelNome: extra.responsavelNome,
        responsavelCpf: extra.responsavelCpf ? formatCPF(extra.responsavelCpf) : null,
        telefone: extra.telefone,
        endereco: extra.endereco,
        emailCorporativo: extra.emailCorporativo,
        emailCorporativoVerificado: extra.emailCorporativoVerificado,
        cartaoCnpjUrl: extra.cartaoCnpjUrl,
        logoUrl: companyLogo,
        fotoResponsavelUrl: companyFoto,
        email: user.email,
      },
      team: {
        isOwner: actor?.isOwner ?? true,
        teamRole: actor?.teamRole || 'OWNER',
        ownerUserId,
      },
      verification,
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
