import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import {
  getCompanyPlanContext,
  isAdvancedFilterKey,
} from '@/lib/company-plan'
import {
  createCompanySearchHistory,
  listCompanyFavoriteProfileIds,
} from '@/lib/company-storage'
import {
  calculateCompatibilityScore,
  INDUSTRIAL_FILTER_KEYS,
  matchesIndustrialFilters,
  parseIndustrialFiltersFromParams,
  parseProfileIndustrial,
  type ProfileIndustrialData,
} from '@/lib/profile-industrial'
import { filterHabilidadesExtras } from '@/lib/company-profile-display'
import { listarPerfisVisualizados } from '@/lib/profile-messages'
import { notifyProfessionalAsync, notifyProfileViewed } from '@/lib/professional-notifications'
import { listActivePremiumProfileIds } from '@/lib/professional-storage'

function salarySearchTerms(input: string): string[] {
  const trimmed = input.trim()
  if (!trimmed) return []
  const digits = trimmed.replace(/\D/g, '')
  const terms = new Set<string>([trimmed])
  if (digits) {
    terms.add(digits)
    const value = Number.parseInt(digits, 10)
    if (!Number.isNaN(value)) {
      terms.add(value.toLocaleString('pt-BR'))
    }
  }
  return [...terms]
}

function maskName(name: string | null | undefined): string {
  if (!name?.trim()) return 'Profissional'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return `${parts[0].charAt(0)}***`
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}***`
}

function parseSkills(skills: string | null): string[] {
  if (!skills) return []
  try {
    const parsed = JSON.parse(skills)
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 8) : []
  } catch {
    return []
  }
}

type ProfileRow = {
  id: string
  title: string | null
  bio: string | null
  mensagemEmpresas: string | null
  areaInteresse: string | null
  cargoDesejado: string | null
  estado: string | null
  cidade: string | null
  escolaridade: string | null
  turnoDisponivel: string | null
  tempoExperiencia: string | null
  recolocacao: string | null
  pretensaoSalarial: string | null
  disponibilidadeInicio: string | null
  disponivelContratacao: string | null
  disponibilidadeMudanca: string | null
  situacaoProfissional?: string | null
  trabalhouIndustria?: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  avatar: string | null
  skills: string | null
  curricoURL: string | null
  formDataJSON: string | null
  cursosCertificacoes: string | null
  experienciasJSON: string | null
  profileCompletion: number
  updatedAt: Date
  user: { name: string | null; email: string }
}

function industrialExtras(industrial: ProfileIndustrialData, showFull: boolean) {
  if (!showFull) {
    return {
      segmentosIndustria: industrial.segmentosIndustria.slice(0, 3),
      maquinasEquipamentos: industrial.maquinasEquipamentos.slice(0, 3),
    }
  }
  return {
    segmentosIndustria: industrial.segmentosIndustria,
    maquinasEquipamentos: industrial.maquinasEquipamentos,
    qualidadeProcessos: industrial.qualidadeProcessos,
    informatica: industrial.informatica,
    certificacoes: industrial.certificacoes,
    idiomas: industrial.idiomas,
    cursos: industrial.cursos,
    possuiCNH: industrial.possuiCNH || '—',
    categoriaCNH: industrial.categoriaCNH || '—',
    aceitaViagens: industrial.aceitaViagens || '—',
    disponibilidadeMudanca: industrial.disponibilidadeMudanca || '—',
    empresas: industrial.empresas,
    certificadosUrl: industrial.certificadosUrl,
  }
}

function buildSummary(profile: ProfileRow, industrial: ProfileIndustrialData, compatibilidade: number, emDestaque: boolean) {
  const habilidades = filterHabilidadesExtras(parseSkills(profile.skills), industrial)
  return {
    id: profile.id,
    nome: maskName(profile.user.name),
    cargo: profile.cargoDesejado || profile.title || '—',
    area: profile.areaInteresse || '—',
    local: profile.cidade && profile.estado
      ? `${profile.cidade}, ${profile.estado}`
      : profile.estado || '—',
    escolaridade: profile.escolaridade || '—',
    turno: profile.turnoDisponivel || '—',
    experiencia: profile.tempoExperiencia || '—',
    recolocacao: profile.recolocacao || '—',
    habilidades,
    avatar: profile.avatar,
    bloqueado: true,
    unlocked: false,
    compatibilidade,
    profileCompletion: profile.profileCompletion,
    emDestaque,
    ...industrialExtras(industrial, false),
  }
}

function buildFull(profile: ProfileRow, industrial: ProfileIndustrialData, compatibilidade: number, showExtended: boolean, emDestaque: boolean) {
  const habilidades = filterHabilidadesExtras(parseSkills(profile.skills), industrial)

  const base = {
    id: profile.id,
    nome: profile.user.name || '—',
    cargo: profile.cargoDesejado || profile.title || '—',
    area: profile.areaInteresse || '—',
    local: profile.cidade && profile.estado
      ? `${profile.cidade}, ${profile.estado}`
      : profile.estado || '—',
    escolaridade: profile.escolaridade || '—',
    turno: profile.turnoDisponivel || '—',
    experiencia: profile.tempoExperiencia || '—',
    recolocacao: profile.recolocacao || '—',
    pretensaoSalarial: profile.pretensaoSalarial || '—',
    mensagem: profile.mensagemEmpresas || profile.bio || '—',
    habilidades,
    avatar: profile.avatar,
    bloqueado: false,
    unlocked: true,
    compatibilidade,
    profileCompletion: profile.profileCompletion,
    emDestaque,
    ...industrialExtras(industrial, showExtended),
  }

  if (!showExtended) return base

  return {
    ...base,
    email: profile.email || profile.user.email,
    telefone: profile.phone || '—',
    whatsapp: profile.whatsapp || '—',
    curriculoURL: profile.curricoURL || null,
    disponibilidadeContratacao:
      industrial.disponivelContratacao
      || profile.disponivelContratacao
      || profile.disponibilidadeInicio
      || '—',
    ultimaAtualizacao: profile.updatedAt.toISOString(),
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const companyUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    })

    if (!companyUser || companyUser.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Acesso restrito a empresas' }, { status: 403 })
    }

    const planContext = await getCompanyPlanContext(companyUser.id)
    const { features, usage, tier, verification } = planContext
    const dataUserId = planContext.ownerUserId || companyUser.id

    const { searchParams } = new URL(request.url)
    const filters = parseIndustrialFiltersFromParams(searchParams)
    const requestedIds = [
      ...new Set(
        (searchParams.get('ids') || '')
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    ].slice(0, 100)
    const rawFilters: Record<string, string> = {}
    for (const key of INDUSTRIAL_FILTER_KEYS) {
      if (filters[key]) rawFilters[key] = filters[key]!
    }

    if (!features.canUseAdvancedFilters && requestedIds.length === 0) {
      const blocked = Object.keys(rawFilters).filter(isAdvancedFilterKey)
      if (blocked.length > 0) {
        return NextResponse.json({
          error: 'Filtros avançados disponíveis a partir do plano Basic.',
          planTier: tier,
          upgradeRequired: 'BASIC',
        }, { status: 403 })
      }
    }

    if (features.canSearchHistory && Object.keys(rawFilters).length > 0 && requestedIds.length === 0) {
      await createCompanySearchHistory(dataUserId, JSON.stringify(rawFilters))
    }

    const activeAccessPromise = prisma.accessRecord.findMany({
      where: {
        companyUserId: dataUserId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      select: { profileId: true },
    })

    const [activeAccess, favoriteProfileIds, viewedIds] = await Promise.all([
      activeAccessPromise,
      listCompanyFavoriteProfileIds(dataUserId),
      listarPerfisVisualizados(dataUserId),
    ])

    const unlockedIds = new Set(activeAccess.map((a) => a.profileId))
    const favoriteIds = new Set(favoriteProfileIds)

    const salaryTerms = filters.pretensaoSalarial ? salarySearchTerms(filters.pretensaoSalarial) : []
    const extraFilters: Record<string, unknown>[] = []
    if (filters.cargo) {
      extraFilters.push({
        OR: [
          { cargoDesejado: { contains: filters.cargo, mode: 'insensitive' } },
          { title: { contains: filters.cargo, mode: 'insensitive' } },
        ],
      })
    }
    if (salaryTerms.length > 0) {
      extraFilters.push({
        OR: salaryTerms.map((term) => ({
          pretensaoSalarial: { contains: term, mode: 'insensitive' as const },
        })),
      })
    }

    const profileSelect = {
      id: true,
      title: true,
      bio: true,
      mensagemEmpresas: true,
      areaInteresse: true,
      cargoDesejado: true,
      estado: true,
      cidade: true,
      escolaridade: true,
      turnoDisponivel: true,
      tempoExperiencia: true,
      recolocacao: true,
      pretensaoSalarial: true,
      disponibilidadeInicio: true,
      disponivelContratacao: true,
      disponibilidadeMudanca: true,
      phone: true,
      whatsapp: true,
      email: true,
      avatar: true,
      skills: true,
      curricoURL: true,
      formDataJSON: true,
      cursosCertificacoes: true,
      experienciasJSON: true,
      profileCompletion: true,
      updatedAt: true,
      situacaoProfissional: true,
      trabalhouIndustria: true,
      user: { select: { name: true, email: true } },
    } as const

    // Limite menor + select: evita carregar centenas de linhas completas a cada busca.
    const scanLimit = requestedIds.length > 0 ? requestedIds.length : 72

    const dbProfiles = await prisma.profile.findMany({
      where: {
        isVisible: true,
        status: 'ACTIVE',
        ...(requestedIds.length > 0
          ? { id: { in: requestedIds } }
          : {
              ...(filters.estado ? { estado: filters.estado } : {}),
              ...(filters.cidade ? { cidade: { contains: filters.cidade, mode: 'insensitive' } } : {}),
              ...(filters.area ? { areaInteresse: filters.area } : {}),
              ...(filters.escolaridade ? { escolaridade: filters.escolaridade } : {}),
              ...(filters.situacaoProfissional ? { situacaoProfissional: filters.situacaoProfissional } : {}),
              ...(filters.trabalhouIndustria ? { trabalhouIndustria: filters.trabalhouIndustria } : {}),
              ...(filters.turno ? { turnoDisponivel: filters.turno } : {}),
              ...(filters.recolocacao ? { recolocacao: { contains: filters.recolocacao, mode: 'insensitive' } } : {}),
              ...(filters.experiencia ? { tempoExperiencia: filters.experiencia } : {}),
              ...(extraFilters.length > 0 ? { AND: extraFilters } : {}),
            }),
      },
      select: profileSelect,
      orderBy: [{ profileCompletion: 'desc' }, { updatedAt: 'desc' }],
      take: scanLimit,
    }) as unknown as ProfileRow[]

    const scored = dbProfiles
      .map((profile) => {
        const industrial = parseProfileIndustrial(profile)
        if (!matchesIndustrialFilters(profile, industrial, filters)) return null
        const compatibilidade = calculateCompatibilityScore(profile, industrial, filters)
        return { profile, industrial, compatibilidade }
      })
      .filter(Boolean) as { profile: ProfileRow; industrial: ProfileIndustrialData; compatibilidade: number }[]

    const premiumProfileIds = await listActivePremiumProfileIds(
      scored.map((s) => s.profile.id),
    )

    if (requestedIds.length > 0) {
      const order = new Map(requestedIds.map((id, index) => [id, index]))
      scored.sort((a, b) => (order.get(a.profile.id) ?? 999) - (order.get(b.profile.id) ?? 999))
    } else {
      scored.sort((a, b) => {
        const aFeatured = premiumProfileIds.has(a.profile.id) ? 1 : 0
        const bFeatured = premiumProfileIds.has(b.profile.id) ? 1 : 0
        if (bFeatured !== aFeatured) return bFeatured - aFeatured
        return b.compatibilidade - a.compatibilidade
          || b.profile.profileCompletion - a.profile.profileCompletion
      })
    }

    const pageRaw = parseInt(searchParams.get('page') || '1', 10)
    const perPageRaw = parseInt(searchParams.get('perPage') || '12', 10)
    const perPage = Math.min(Math.max(Number.isFinite(perPageRaw) ? perPageRaw : 12, 6), 48)
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1

    const total = scored.length
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const offset = (safePage - 1) * perPage
    const pageSlice = scored.slice(offset, offset + perPage)

    const unlockedScored = verification.canAccessSensitiveProfiles
      ? scored.filter(({ profile }) => unlockedIds.has(profile.id))
      : []

    // Só monta payload completo dos desbloqueados da página atual (mais leve).
    const pageUnlockedIds = new Set(
      pageSlice.filter(({ profile }) => unlockedIds.has(profile.id)).map(({ profile }) => profile.id),
    )
    const allDesbloqueados = unlockedScored
      .filter(({ profile }) => pageUnlockedIds.has(profile.id))
      .map(({ profile, industrial, compatibilidade }) => ({
        ...buildFull(profile, industrial, compatibilidade, features.canViewContacts, premiumProfileIds.has(profile.id)),
        favorito: favoriteIds.has(profile.id),
        visualizado: viewedIds.has(profile.id),
      }))

    const profissionais = pageSlice.map(({ profile, industrial, compatibilidade }) => {
      const unlocked = unlockedIds.has(profile.id) && verification.canAccessSensitiveProfiles
      const emDestaque = premiumProfileIds.has(profile.id)
      const base = unlocked
        ? buildFull(profile, industrial, compatibilidade, features.canViewContacts, emDestaque)
        : buildSummary(profile, industrial, compatibilidade, emDestaque)
      return {
        ...base,
        bloqueado: !unlocked,
        favorito: favoriteIds.has(profile.id),
        visualizado: unlocked && viewedIds.has(profile.id),
      }
    })

    const maxUnlocks = features.unlimitedUnlocks ? null : features.maxUnlocksPerMonth ?? 0

    return NextResponse.json({
      profissionais,
      desbloqueados: allDesbloqueados,
      desbloqueadosTotal: unlockedScored.length,
      pagination: {
        page: safePage,
        perPage,
        total,
        totalPages,
      },
      planTier: tier,
      features,
      verification,
      unlockedCount: usage.activeUnlocks,
      unlocksThisMonth: usage.unlocksThisMonth,
      maxUnlocks,
      slotsRestantes: usage.unlocksRemaining,
      favoritesCount: usage.favoritesCount,
      favoritesRemaining: usage.favoritesRemaining,
      canUnlock: features.canUnlockContacts && (usage.unlocksRemaining === null || usage.unlocksRemaining > 0),
      totalEncontrados: scored.length,
    })
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error)
    return NextResponse.json({ error: 'Erro ao buscar profissionais' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const companyUser = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    })

    if (!companyUser || companyUser.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Acesso restrito a empresas' }, { status: 403 })
    }

    const planContext = await getCompanyPlanContext(companyUser.id)
    const dataUserId = planContext.ownerUserId || companyUser.id
    const { features, usage, tier, verification } = planContext

    if (!features.canUnlockContacts) {
      return NextResponse.json({
        error: verification.canAccessSensitiveProfiles
          ? 'Liberação de contatos disponível a partir do plano Basic.'
          : 'Para liberar contatos, confirme o e-mail corporativo e aguarde a aprovação do cartão CNPJ.',
        planTier: tier,
        upgradeRequired: verification.canAccessSensitiveProfiles ? 'BASIC' : undefined,
        verificationStatus: verification.verificationStatus,
      }, { status: 403 })
    }

    const { profileId } = await request.json()

    if (!profileId) {
      return NextResponse.json({ error: 'Perfil não informado' }, { status: 400 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { user: { select: { name: true, email: true } } },
    })

    if (!profile || !profile.isVisible || profile.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Perfil não disponível' }, { status: 404 })
    }

    const existing = await prisma.accessRecord.findFirst({
      where: {
        profileId,
        companyUserId: dataUserId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    })

    const industrial = parseProfileIndustrial(profile as ProfileRow)
    const compatibilidade = calculateCompatibilityScore(profile as ProfileRow, industrial, {})
    const premiumIds = await listActivePremiumProfileIds([profileId])
    const emDestaque = premiumIds.has(profileId)

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        profile: buildFull({ ...profile, user: profile.user } as ProfileRow, industrial, compatibilidade, features.canViewContacts, emDestaque),
      })
    }

    if (!features.unlimitedUnlocks && usage.unlocksRemaining !== null && usage.unlocksRemaining <= 0) {
      return NextResponse.json({
        error: tier === 'BASIC'
          ? 'Limite de 50 liberações de contato por mês atingido. Faça upgrade para Premium.'
          : 'Limite de liberações atingido.',
        planTier: tier,
        upgradeRequired: tier === 'BASIC' ? 'PREMIUM' : undefined,
      }, { status: 403 })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await prisma.accessRecord.create({
      data: {
        profileId,
        companyUserId: dataUserId,
        accessType: 'FULL',
        expiresAt,
        status: 'ACTIVE',
      },
    })

    await prisma.profileView.create({
      data: {
        profileId,
        companyUserId: dataUserId,
        viewType: 'FULL',
      },
    })

    notifyProfessionalAsync(() =>
      notifyProfileViewed(profileId, dataUserId)
    )

    return NextResponse.json({
      success: true,
      profile: buildFull({ ...profile, user: profile.user } as ProfileRow, industrial, compatibilidade, features.canViewContacts, emDestaque),
      unlockedCount: usage.activeUnlocks + 1,
    })
  } catch (error) {
    console.error('Erro ao desbloquear perfil:', error)
    return NextResponse.json({ error: 'Erro ao desbloquear perfil' }, { status: 500 })
  }
}
