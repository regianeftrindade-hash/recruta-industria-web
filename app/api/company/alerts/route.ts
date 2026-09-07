import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { getCompanyPlanContext } from '@/lib/company-plan'
import {
  createCompanyAlert,
  deleteCompanyAlert,
  findAlertMatches,
  listCompanyAlerts,
  toggleCompanyAlert,
} from '@/lib/company-features-db'
import type { IndustrialFilters } from '@/lib/profile-industrial'
import { sanitizeIndustrialFilters, hasActiveIndustrialFilters } from '@/lib/profile-industrial'
import { parseJsonSafe } from '@/lib/professional-profile-map'

function parseAlertFilters(filtersJSON: string | IndustrialFilters | null | undefined): IndustrialFilters {
  if (filtersJSON && typeof filtersJSON === 'object') {
    return sanitizeIndustrialFilters(filtersJSON)
  }
  const raw = parseJsonSafe<IndustrialFilters>(String(filtersJSON || ''), {})
  return sanitizeIndustrialFilters(raw)
}

export async function GET(request: NextRequest) {
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
    const dataUserId = planContext.ownerUserId || user.id
    if (!planContext.features.canUseAlerts) {
      return NextResponse.json({ error: 'Alertas disponíveis a partir do plano Premium.' }, { status: 403 })
    }

    const alerts = await listCompanyAlerts(user.id)
    const includeMatches = new URL(request.url).searchParams.get('matches') === '1'

    // Matches pesados só sob demanda (?matches=1) — listagem fica leve no mount.
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const withMatches = await Promise.all(alerts.map(async (alert) => {
      const filters = parseAlertFilters(alert.filtersJSON)
      let newMatches: { profileId: string; score: number; updatedAt: string; nome?: string; cargo?: string }[] = []
      if (includeMatches && alert.active) {
        try {
          newMatches = await findAlertMatches(filters, since, 10)
        } catch {
          newMatches = []
        }
      }
      return {
        id: alert.id,
        name: alert.name,
        filters,
        active: alert.active,
        createdAt: alert.createdAt.toISOString(),
        newMatches,
        matchCount: newMatches.length,
      }
    }))

    // Enriquece matches com nome e cargo (uma consulta só)
    if (includeMatches) {
      const matchIds = [...new Set(withMatches.flatMap((a) => a.newMatches.map((m) => m.profileId)))]
      if (matchIds.length > 0) {
        const profiles = await prisma.profile.findMany({
          where: { id: { in: matchIds } },
          select: {
            id: true,
            title: true,
            cargoDesejado: true,
            user: { select: { name: true } },
          },
        })
        const byId = new Map(profiles.map((p) => [p.id, p]))
        for (const alert of withMatches) {
          alert.newMatches = alert.newMatches.map((m) => {
            const p = byId.get(m.profileId)
            return {
              ...m,
              nome: p?.user?.name || 'Profissional',
              cargo: p?.cargoDesejado?.trim() || p?.title?.trim() || 'Sem cargo informado',
            }
          })
        }
      }
    }

    return NextResponse.json({ alerts: withMatches })
  } catch (error) {
    console.error('Erro ao listar alertas:', error)
    return NextResponse.json({ error: 'Erro ao listar alertas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const dataUserId = planContext.ownerUserId || user.id
    if (!planContext.features.canUseAlerts) {
      return NextResponse.json({ error: 'Alertas disponíveis a partir do plano Premium.' }, { status: 403 })
    }

    const body = await request.json()
    const name = String(body.name || '').trim()
    const filters = sanitizeIndustrialFilters(body.filters || {})
    if (!name) {
      return NextResponse.json({ error: 'Informe um nome para o alerta' }, { status: 400 })
    }
    if (!hasActiveIndustrialFilters(filters)) {
      return NextResponse.json({
        error: 'Defina ao menos um filtro de preferência antes de criar o alerta.',
      }, { status: 400 })
    }

    const id = await createCompanyAlert(user.id, name, filters)
    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Erro ao criar alerta:', error)
    return NextResponse.json({ error: 'Erro ao criar alerta' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    const { alertId, active } = await request.json()
    if (!alertId) {
      return NextResponse.json({ error: 'Alerta não informado' }, { status: 400 })
    }

    await toggleCompanyAlert(user.id, alertId, !!active)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar alerta:', error)
    return NextResponse.json({ error: 'Erro ao atualizar alerta' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('alertId')
    if (!alertId) {
      return NextResponse.json({ error: 'Alerta não informado' }, { status: 400 })
    }

    await deleteCompanyAlert(user.id, alertId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir alerta:', error)
    return NextResponse.json({ error: 'Erro ao excluir alerta' }, { status: 500 })
  }
}
