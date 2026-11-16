import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { getCompanyPlanContext } from '@/lib/company-plan'
import { parseProfileIndustrial } from '@/lib/profile-industrial'
import { renderProfileExportHtml } from '@/lib/company/profile-export-html'
import { profileExportDecision, profileExportFileSlug } from '@/lib/company/profile-export-access'
import { resolveInterfaceLocale } from '@/lib/i18n/resolve-interface-locale'
import { resolveLocale } from '@/lib/i18n/locales'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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
    if (profileExportDecision({ canExportProfiles: planContext.features.canExportProfiles, hasActiveUnlock: true }) === 'plan') {
      return NextResponse.json({ error: 'Exportação disponível a partir do plano Premium.' }, { status: 403 })
    }

    const { id: profileId } = await params
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { user: { select: { name: true, email: true } } },
    })

    if (!profile || !profile.isVisible || profile.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const unlocked = await prisma.accessRecord.findFirst({
      where: {
        profileId,
        companyUserId: planContext.ownerUserId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    })

    const decision = profileExportDecision({
      canExportProfiles: planContext.features.canExportProfiles,
      hasActiveUnlock: Boolean(unlocked),
    })
    if (decision === 'plan') {
      return NextResponse.json({ error: 'Exportação disponível a partir do plano Premium.' }, { status: 403 })
    }
    if (decision === 'locked') {
      return NextResponse.json({ error: 'Desbloqueie o perfil para exportar.' }, { status: 403 })
    }

    const industrial = parseProfileIndustrial(profile)
    const requested = request.nextUrl.searchParams.get('idioma')
    const locale = requested ? resolveLocale(requested) : await resolveInterfaceLocale()
    const nome = profile.user.name || 'Profissional'
    const html = renderProfileExportHtml({
      nome,
      cargo: profile.cargoDesejado || profile.title,
      area: profile.areaInteresse,
      cidade: profile.cidade,
      estado: profile.estado,
      email: profile.email || profile.user.email,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      disponibilidade: industrial.disponivelContratacao || profile.disponibilidadeInicio,
      escolaridade: profile.escolaridade,
      cursos: industrial.cursos,
      certificacoes: industrial.certificacoes,
      idiomas: industrial.idiomas,
      tempoExperiencia: profile.tempoExperiencia,
      segmentos: industrial.segmentosIndustria,
      maquinas: industrial.maquinasEquipamentos,
      qualidade: industrial.qualidadeProcessos,
      informatica: industrial.informatica,
      empresas: industrial.empresas,
      turno: profile.turnoDisponivel,
      pretensao: profile.pretensaoSalarial,
      cnh: industrial.possuiCNH,
      categoriaCnh: industrial.categoriaCNH,
      viagens: industrial.aceitaViagens,
      mudanca: industrial.disponibilidadeMudanca,
      apresentacao: profile.mensagemEmpresas || profile.bio,
    }, locale)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="perfil-${profileExportFileSlug(nome)}.html"`,
      },
    })
  } catch (error) {
    console.error('Erro ao exportar perfil:', error)
    return NextResponse.json({ error: 'Erro ao exportar perfil' }, { status: 500 })
  }
}
