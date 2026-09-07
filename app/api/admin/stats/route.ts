import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { COMPANY_PLAN_TIERS, getPlanDefinition } from '@/lib/company/company-premium-plans';

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(dayKey(d));
  }
  return days;
}

function isActiveSubscription(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() > Date.now();
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const days = lastNDays(14);
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 13);

    const [
      totalVisits,
      uniqueSessions,
      visitsToday,
      professionals,
      companies,
      profilesActive,
      companiesPending,
      visitRows,
      professionalRows,
      companyRows,
      planRows,
      trackingRows,
      paidPaymentsAgg,
    ] = await Promise.all([
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM "SiteVisit"
      `.then((r) => Number(r[0]?.count || 0)).catch(() => 0),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT "sessionId")::bigint AS count
        FROM "SiteVisit"
        WHERE "sessionId" IS NOT NULL
      `.then((r) => Number(r[0]?.count || 0)).catch(() => 0),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "SiteVisit"
        WHERE "createdAt" >= date_trunc('day', NOW())
      `.then((r) => Number(r[0]?.count || 0)).catch(() => 0),
      prisma.user.count({ where: { role: 'PROFESSIONAL' } }),
      prisma.user.count({ where: { role: 'COMPANY' } }),
      prisma.profile.count({ where: { status: 'ACTIVE', isVisible: true } }),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "Company"
        WHERE "verificationStatus" = 'PENDING'
          AND "cartaoCnpjUrl" IS NOT NULL
          AND TRIM("cartaoCnpjUrl") <> ''
      `.then((r) => Number(r[0]?.count || 0)).catch(() => 0),
      prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM "SiteVisit"
        WHERE "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1
      `.catch(() => [] as Array<{ day: Date; count: bigint }>),
      prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM "User"
        WHERE role = 'PROFESSIONAL' AND "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM "User"
        WHERE role = 'COMPANY' AND "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<Array<{ planTier: string | null; subscriptionExpiresAt: Date | null; count: bigint }>>`
        SELECT "planTier", "subscriptionExpiresAt", COUNT(*)::bigint AS count
        FROM "Company"
        GROUP BY "planTier", "subscriptionExpiresAt"
      `.catch(() => [] as Array<{ planTier: string | null; subscriptionExpiresAt: Date | null; count: bigint }>),
      prisma.$queryRaw<Array<{
        contatados: bigint;
        entrevistados: bigint;
        testados: bigint;
        contratados: bigint;
        naoContratados: bigint;
      }>>`
        SELECT
          COUNT(*) FILTER (WHERE contatado = true)::bigint AS contatados,
          COUNT(*) FILTER (WHERE entrevistado = true)::bigint AS entrevistados,
          COUNT(*) FILTER (WHERE "emTeste" = true)::bigint AS testados,
          COUNT(*) FILTER (WHERE contratado = true)::bigint AS contratados,
          COUNT(*) FILTER (WHERE "naoContratado" = true)::bigint AS "naoContratados"
        FROM "CompanyProfileTracking"
      `.catch(() => [{
        contatados: BigInt(0),
        entrevistados: BigInt(0),
        testados: BigInt(0),
        contratados: BigInt(0),
        naoContratados: BigInt(0),
      }]),
      prisma.paymentRecord.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
        _count: { _all: true },
      }).catch(() => ({ _sum: { amount: null as number | null }, _count: { _all: 0 } })),
    ]);

    const toMap = (rows: Array<{ day: Date; count: bigint }>) => {
      const map = new Map<string, number>();
      for (const row of rows) {
        map.set(dayKey(new Date(row.day)), Number(row.count));
      }
      return map;
    };

    const visitMap = toMap(visitRows);
    const proMap = toMap(professionalRows);
    const companyMap = toMap(companyRows);

    const series = days.map((day) => ({
      day,
      label: day.slice(5).replace('-', '/'),
      visits: visitMap.get(day) || 0,
      professionals: proMap.get(day) || 0,
      companies: companyMap.get(day) || 0,
    }));

    const planCounts: Record<string, number> = {
      FREE: 0,
      BASIC: 0,
      PREMIUM: 0,
      EMPRESARIAL: 0,
    };

    for (const row of planRows) {
      const tier = String(row.planTier || 'FREE').toUpperCase();
      const count = Number(row.count || 0);
      if (tier === 'FREE') {
        planCounts.FREE += count;
        continue;
      }
      if (!isActiveSubscription(row.subscriptionExpiresAt)) {
        planCounts.FREE += count;
        continue;
      }
      if (tier in planCounts) {
        planCounts[tier] += count;
      } else {
        planCounts.FREE += count;
      }
    }

    const paidPlans = (['BASIC', 'PREMIUM', 'EMPRESARIAL'] as const).map((tier) => {
      const def = getPlanDefinition(tier);
      const subscriptions = planCounts[tier] || 0;
      const unitPriceCentavos = def.precoCentavos;
      const revenueCentavos = subscriptions * unitPriceCentavos;
      return {
        tier,
        nome: def.nome,
        preco: def.preco,
        unitPriceCentavos,
        subscriptions,
        revenueCentavos,
        revenueLabel: `R$ ${(revenueCentavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      };
    });

    const plansRevenueTotalCentavos = paidPlans.reduce((sum, p) => sum + p.revenueCentavos, 0);
    const tracking = trackingRows[0] || {
      contatados: BigInt(0),
      entrevistados: BigInt(0),
      testados: BigInt(0),
      contratados: BigInt(0),
      naoContratados: BigInt(0),
    };

    // PaymentRecord.amount é gravado em centavos
    const collectedCentavos = Math.round(Number(paidPaymentsAgg._sum.amount || 0));
    const collectedPayments = Number(paidPaymentsAgg._count._all || 0);
    const formatBrlFromCentavos = (centavos: number) =>
      `R$ ${(centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    return NextResponse.json({
      totals: {
        visits: totalVisits,
        uniqueSessions,
        visitsToday,
        professionals,
        companies,
        profilesActive,
        companiesPending,
        freeCompanies: planCounts.FREE,
        contatados: Number(tracking.contatados || 0),
        entrevistados: Number(tracking.entrevistados || 0),
        testados: Number(tracking.testados || 0),
        contratados: Number(tracking.contratados || 0),
        naoContratados: Number(tracking.naoContratados || 0),
      },
      plans: {
        items: paidPlans,
        totalSubscriptions: paidPlans.reduce((sum, p) => sum + p.subscriptions, 0),
        totalRevenueCentavos: plansRevenueTotalCentavos,
        totalRevenueLabel: formatBrlFromCentavos(plansRevenueTotalCentavos),
        totalCollectedCentavos: collectedCentavos,
        totalCollectedLabel: formatBrlFromCentavos(collectedCentavos),
        collectedPayments,
        catalog: COMPANY_PLAN_TIERS.filter((p) => p.id !== 'FREE').map((p) => ({
          tier: p.id,
          nome: p.nome,
          preco: p.preco,
          precoCentavos: p.precoCentavos,
        })),
      },
      series,
    });
  } catch (error) {
    console.error('Erro ao carregar estatísticas admin:', error);
    return NextResponse.json({ error: 'Erro ao carregar estatísticas' }, { status: 500 });
  }
}
