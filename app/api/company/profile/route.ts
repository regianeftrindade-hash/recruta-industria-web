import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { getCompanyExtraData, getCompanyVerificationInfo } from '@/lib/company-storage'
import { ensureCompanyTestBypassReady, matchesCompanyTestBypass } from '@/lib/company/company-test-bypass'
import { formatCPF, formatCNPJ } from '@/lib/security'
import { getCompanyPlanContext } from '@/lib/company-plan'
import { getPlanDefinition } from '@/lib/company-premium-plans'
import { resolveCompanyActor } from '@/lib/company/company-team'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const email = session.user.email.toLowerCase().trim()
    let user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    // Bypass só quando o e-mail bate — evita findUnique/writes extras no caminho normal
    if (
      matchesCompanyTestBypass({
        email: user.email,
        companyName: user.company?.name,
        userName: user.name,
      })
    ) {
      await ensureCompanyTestBypassReady(user.id)
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { company: true },
      })
      if (!user) {
        return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
      }
    }

    const actor = await resolveCompanyActor(user.id)
    const ownerUserId = actor?.ownerUserId || user.id

    // Se o ator é o dono e já temos company no include, não busca de novo
    const ownerUser =
      ownerUserId === user.id && user.company
        ? user
        : await prisma.user.findUnique({
            where: { id: ownerUserId },
            include: { company: true },
          })

    if (!ownerUser?.company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    // Uma leitura de extras → verificação + plano (sem repetir queries)
    const extra = await getCompanyExtraData(ownerUserId)
    const verification = await getCompanyVerificationInfo(ownerUserId, extra)
    const planContext = await getCompanyPlanContext(user.id, {
      ownerUserId,
      verification,
    })
    const planDef = getPlanDefinition(planContext.tier)

    const companyLogo =
      extra.logoUrl
      || (ownerUser.company as { logoUrl?: string | null }).logoUrl
      || null
    const companyFoto =
      extra.fotoResponsavelUrl
      || (ownerUser.company as { fotoResponsavelUrl?: string | null }).fotoResponsavelUrl
      || null

    return NextResponse.json({
      company: {
        id: ownerUser.company.id,
        razaoSocial: ownerUser.company.name,
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
