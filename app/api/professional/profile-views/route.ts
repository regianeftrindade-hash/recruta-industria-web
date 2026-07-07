import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { getProfessionalPlanContext } from '@/lib/professional-plan';
import { ensurePaymentSchema } from '@/lib/ensure-db-schema';

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: NextRequest) {
  try {
    await ensurePaymentSchema();

    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return NextResponse.json({
        allViews: [],
        totalViews: 0,
        lastViewAt: null,
        lastViewType: null,
        lastViewCompany: null,
        weekViews: [],
        isPremium: false,
        companyNamesHidden: true,
      });
    }

    const planContext = await getProfessionalPlanContext(user.id);
    const canSeeNames = planContext.features.canSeeCompanyNames;

    const profileViews = await prisma.profileView.findMany({
      where: { profileId: user.profile.id },
      orderBy: { createdAt: 'desc' },
    });

    const companyIds = [...new Set(profileViews.map((view) => view.companyUserId))];
    const companies = companyIds.length > 0
      ? await prisma.company.findMany({
          where: { userId: { in: companyIds } },
          select: { userId: true, name: true },
        })
      : [];
    const companyNameByUserId = new Map(companies.map((c) => [c.userId, c.name]));

    const enrichedViews = profileViews.map((view) => ({
      id: view.id,
      createdAt: view.createdAt,
      viewType: view.viewType,
      companyName: canSeeNames
        ? (companyNameByUserId.get(view.companyUserId) || 'Empresa')
        : null,
    }));

    const startOfWeek = getStartOfWeek(new Date());
    const weekViews = enrichedViews.filter(
      (view) => new Date(view.createdAt) >= startOfWeek,
    );

    const lastView = profileViews[0] ?? null;

    return NextResponse.json({
      allViews: enrichedViews,
      totalViews: profileViews.length,
      lastViewAt: lastView?.createdAt ?? null,
      lastViewType: lastView?.viewType ?? null,
      lastViewCompany: lastView && canSeeNames
        ? (companyNameByUserId.get(lastView.companyUserId) || 'Empresa')
        : null,
      weekViews,
      weekViewsCount: weekViews.length,
      isPremium: planContext.isPremium,
      companyNamesHidden: !canSeeNames,
      plan: {
        tier: planContext.tier,
        features: planContext.features,
        subscriptionExpiresAt: planContext.subscriptionExpiresAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar visualizações:', error);
    return NextResponse.json({ error: 'Erro ao buscar visualizações' }, { status: 500 });
  }
}
