import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { getCompanyPlanContext } from '@/lib/company-plan'
import { countCompanyFavorites, listCompanySearchHistory } from '@/lib/company-storage'
import { listCompanyAlerts } from '@/lib/company-features-db'

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
    if (!planContext.features.canViewDashboardStats) {
      return NextResponse.json({ error: 'Dashboard disponível a partir do plano Basic.' }, { status: 403 })
    }

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [unlocksCount, searchesCount, favoritesCount, alertsCount] = await Promise.all([
      prisma.accessRecord.count({
        where: { companyUserId: user.id, createdAt: { gte: startOfMonth } },
      }),
      listCompanySearchHistory(user.id, 100).then((h) => h.length),
      countCompanyFavorites(user.id),
      listCompanyAlerts(user.id).then((a) => a.filter((x) => x.active).length),
    ])

    return NextResponse.json({
      stats: {
        perfisFavoritados: favoritesCount,
        pesquisasRealizadas: searchesCount,
        liberacoesMes: unlocksCount,
        alertasConfigurados: alertsCount,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
