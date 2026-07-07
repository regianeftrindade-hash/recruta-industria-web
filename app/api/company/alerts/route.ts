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
import { parseJsonSafe } from '@/lib/professional-profile-map'

export async function GET() {
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
    if (!planContext.features.canUseAlerts) {
      return NextResponse.json({ error: 'Alertas disponíveis a partir do plano Premium.' }, { status: 403 })
    }

    const alerts = await listCompanyAlerts(user.id)
    const since = new Date()
    since.setDate(since.getDate() - 30)

    const withMatches = await Promise.all(
      alerts.map(async (alert) => {
        const filters = parseJsonSafe<IndustrialFilters>(alert.filtersJSON, {})
        const matches = alert.active ? await findAlertMatches(filters, since, 5) : []
        return {
          id: alert.id,
          name: alert.name,
          filters,
          active: alert.active,
          createdAt: alert.createdAt.toISOString(),
          newMatches: matches,
        }
      }),
    )

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
    if (!planContext.features.canUseAlerts) {
      return NextResponse.json({ error: 'Alertas disponíveis a partir do plano Premium.' }, { status: 403 })
    }

    const body = await request.json()
    const name = String(body.name || '').trim()
    const filters = (body.filters || {}) as IndustrialFilters
    if (!name) {
      return NextResponse.json({ error: 'Informe um nome para o alerta' }, { status: 400 })
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
