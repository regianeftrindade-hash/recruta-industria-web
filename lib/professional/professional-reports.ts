import { prisma } from '@/lib/db';
import { countMensagensDoPerfil } from '@/lib/profile-messages';
import { ensureProfileMessageTable } from '@/lib/ensure-db-schema';

export interface ViewByCompany {
  companyName: string;
  totalViews: number;
  fullViews: number;
  summaryViews: number;
  lastViewAt: string;
}

export interface ProfessionalActivityReport {
  period: '7d' | '30d' | 'all';
  totalViews: number;
  fullViews: number;
  summaryViews: number;
  weekViews: number;
  monthViews: number;
  viewsByCompany: ViewByCompany[];
  favoritesCount: number;
  tipsCount: number;
  messagesCount: number;
  recentActivity: Array<{
    type: 'view' | 'tip' | 'message' | 'favorite';
    label: string;
    createdAt: string;
  }>;
}

function periodStart(period: '7d' | '30d' | 'all'): Date | null {
  if (period === 'all') return null;
  const days = period === '7d' ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function buildProfessionalActivityReport(
  profileId: string,
  period: '7d' | '30d' | 'all' = '30d',
): Promise<ProfessionalActivityReport> {
  const since = periodStart(period);
  const startOfWeek = getStartOfWeek(new Date());
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [views, tips, messages, favorites] = await Promise.all([
    prisma.profileView.findMany({
      where: {
        profileId,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tip.count({ where: { profileId } }),
    countMensagensDoPerfil(profileId),
    prisma.companyFavorite.count({ where: { profileId } }).catch(() => 0),
  ]);

  const allViews = await prisma.profileView.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
  });

  const companyIds = [...new Set(views.map((v) => v.companyUserId))];
  const companies = companyIds.length > 0
    ? await prisma.company.findMany({
        where: { userId: { in: companyIds } },
        select: { userId: true, name: true },
      })
    : [];
  const companyNameByUserId = new Map(companies.map((c) => [c.userId, c.name]));

  const byCompany = new Map<string, ViewByCompany>();

  for (const view of views) {
    const name = companyNameByUserId.get(view.companyUserId) || 'Empresa';
    const key = view.companyUserId;
    const existing = byCompany.get(key) ?? {
      companyName: name,
      totalViews: 0,
      fullViews: 0,
      summaryViews: 0,
      lastViewAt: view.createdAt.toISOString(),
    };
    existing.totalViews += 1;
    if (view.viewType === 'FULL') existing.fullViews += 1;
    else existing.summaryViews += 1;
    if (new Date(view.createdAt) > new Date(existing.lastViewAt)) {
      existing.lastViewAt = view.createdAt.toISOString();
    }
    byCompany.set(key, existing);
  }

  const viewsByCompany = [...byCompany.values()].sort(
    (a, b) => b.totalViews - a.totalViews || new Date(b.lastViewAt).getTime() - new Date(a.lastViewAt).getTime(),
  );

  const weekViews = allViews.filter((v) => new Date(v.createdAt) >= startOfWeek).length;
  const monthViews = allViews.filter((v) => new Date(v.createdAt) >= startOfMonth).length;
  const fullViews = views.filter((v) => v.viewType === 'FULL').length;
  const summaryViews = views.filter((v) => v.viewType !== 'FULL').length;

  const recentViews = allViews.slice(0, 15).map((v) => ({
    type: 'view' as const,
    label: `${companyNameByUserId.get(v.companyUserId) || 'Empresa'} visualizou (${v.viewType === 'FULL' ? 'completo' : 'resumo'})`,
    createdAt: v.createdAt.toISOString(),
  }));

  const recentTips = await prisma.tip.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { createdAt: true },
  });

  await ensureProfileMessageTable();
  const recentMessages = await prisma.$queryRaw<
    Array<{ companyName: string; createdAt: Date }>
  >`
    SELECT "companyName", "createdAt"
    FROM "ProfileMessage"
    WHERE "profileId" = ${profileId}
    ORDER BY "createdAt" DESC
    LIMIT 5
  `;

  const recentFavorites = await prisma.companyFavorite.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { company: { select: { name: true } } },
  });

  const recentActivity = [
    ...recentViews,
    ...recentTips.map((t) => ({
      type: 'tip' as const,
      label: 'Nova dica recebida',
      createdAt: t.createdAt.toISOString(),
    })),
    ...recentMessages.map((m) => ({
      type: 'message' as const,
      label: `Mensagem de ${m.companyName}`,
      createdAt: m.createdAt.toISOString(),
    })),
    ...recentFavorites.map((f) => ({
      type: 'favorite' as const,
      label: `${f.company.name} favoritou seu perfil`,
      createdAt: f.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  return {
    period,
    totalViews: views.length,
    fullViews,
    summaryViews,
    weekViews,
    monthViews,
    viewsByCompany,
    favoritesCount: favorites,
    tipsCount: tips,
    messagesCount: messages,
    recentActivity,
  };
}
