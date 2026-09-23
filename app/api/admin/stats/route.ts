import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAdmin, getAdminEmails } from '@/lib/auth/admin-auth';
import { COMPANY_PLAN_TIERS, getPlanDefinition } from '@/lib/company/company-premium-plans';
import {
  getAdminExcludedTestAccounts,
  getAdminStatsBaselineAt,
  sqlAndUserIdNotIn,
  sumPaidExcludingTestEmails,
} from '@/lib/admin/admin-exclude-test-accounts';

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

function periodStarts() {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const startWeek = new Date(startToday);
  startWeek.setDate(startWeek.getDate() - 6);

  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return { startToday, startWeek, startMonth };
}

async function countRaw(
  query: Promise<Array<{ count: bigint }>>,
): Promise<number> {
  try {
    const rows = await query;
    return Number(rows[0]?.count || 0);
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const days = lastNDays(14);
    const seriesWindowStart = new Date();
    seriesWindowStart.setHours(0, 0, 0, 0);
    seriesWindowStart.setDate(seriesWindowStart.getDate() - 13);

    const baselineAt = getAdminStatsBaselineAt();
    const seriesSince =
      seriesWindowStart.getTime() > baselineAt.getTime()
        ? seriesWindowStart
        : baselineAt;

    const { startToday, startWeek, startMonth } = periodStarts();
    const dayFrom = startToday.getTime() > baselineAt.getTime() ? startToday : baselineAt;
    const weekFrom = startWeek.getTime() > baselineAt.getTime() ? startWeek : baselineAt;
    const monthFrom = startMonth.getTime() > baselineAt.getTime() ? startMonth : baselineAt;

    const { userIds: excludedIds, emails: excludedEmails } =
      await getAdminExcludedTestAccounts();
    const adminEmails = getAdminEmails();

    // Admins nunca entram nas contagens de profissional/empresa.
    const adminUsers = adminEmails.length
      ? await prisma.user.findMany({
          where: { email: { in: adminEmails, mode: 'insensitive' } },
          select: { id: true, email: true },
        })
      : [];
    const adminIds = adminUsers.map((u) => u.id);
    const excludeIds = [...new Set([...excludedIds, ...adminIds])];
    const excludeEmails = [
      ...new Set([
        ...excludedEmails.map((e) => e.toLowerCase()),
        ...adminEmails,
      ]),
    ];

    const notExcludedUser = excludeIds.length ? { id: { notIn: excludeIds } } : {};
    const notExcludedProfileUser = excludeIds.length
      ? { userId: { notIn: excludeIds } }
      : {};
    const excludeUserSql = sqlAndUserIdNotIn(Prisma.sql`id`, excludeIds);
    const excludeCompanyUserSql = sqlAndUserIdNotIn(Prisma.sql`"userId"`, excludeIds);
    const excludeProfileUserSql = sqlAndUserIdNotIn(Prisma.sql`"userId"`, excludeIds);
    const excludeTrackingCompanySql = sqlAndUserIdNotIn(
      Prisma.sql`"companyUserId"`,
      excludeIds,
    );

    const countUsers = (role: 'PROFESSIONAL' | 'COMPANY', from: Date) =>
      prisma.user.count({
        where: {
          role,
          createdAt: { gte: from },
          ...notExcludedUser,
        },
      });

    const countGoogleUsers = (from: Date) =>
      prisma.user.count({
        where: {
          passwordHash: null,
          createdAt: { gte: from },
          ...notExcludedUser,
        },
      });

    const countVisits = (from: Date) =>
      countRaw(
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint AS count
          FROM "SiteVisit"
          WHERE "createdAt" >= ${from}
        `,
      );

    const countSessions = (from: Date) =>
      countRaw(
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(DISTINCT "sessionId")::bigint AS count
          FROM "SiteVisit"
          WHERE "sessionId" IS NOT NULL
            AND "createdAt" >= ${from}
        `,
      );

    const [
      visitsTotal,
      visitsToday,
      visitsWeek,
      visitsMonth,
      sessionsTotal,
      sessionsToday,
      sessionsWeek,
      sessionsMonth,
      googleTotal,
      googleToday,
      googleWeek,
      googleMonth,
      proTotal,
      proToday,
      proWeek,
      proMonth,
      companyTotal,
      companyToday,
      companyWeek,
      companyMonth,
      proProfilesComplete,
      proProfilesActive,
      companyComplete,
      companyActiveVerified,
      companiesPending,
      visitRows,
      professionalRows,
      companyRows,
      planRows,
      trackingRows,
      paidPayments,
    ] = await Promise.all([
      countVisits(baselineAt),
      countVisits(dayFrom),
      countVisits(weekFrom),
      countVisits(monthFrom),
      countSessions(baselineAt),
      countSessions(dayFrom),
      countSessions(weekFrom),
      countSessions(monthFrom),
      countGoogleUsers(baselineAt),
      countGoogleUsers(dayFrom),
      countGoogleUsers(weekFrom),
      countGoogleUsers(monthFrom),
      countUsers('PROFESSIONAL', baselineAt),
      countUsers('PROFESSIONAL', dayFrom),
      countUsers('PROFESSIONAL', weekFrom),
      countUsers('PROFESSIONAL', monthFrom),
      countUsers('COMPANY', baselineAt),
      countUsers('COMPANY', dayFrom),
      countUsers('COMPANY', weekFrom),
      countUsers('COMPANY', monthFrom),
      countRaw(
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint AS count
          FROM "Profile"
          WHERE "createdAt" >= ${baselineAt}
            AND (
              (cpf IS NOT NULL AND length(regexp_replace(cpf, '\\D', '', 'g')) = 11)
              OR "profileCompletion" >= 40
            )
            ${excludeProfileUserSql}
        `,
      ),
      prisma.profile.count({
        where: {
          status: 'ACTIVE',
          isVisible: true,
          createdAt: { gte: baselineAt },
          ...notExcludedProfileUser,
        },
      }),
      countRaw(
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint AS count
          FROM "Company"
          WHERE "createdAt" >= ${baselineAt}
            AND name IS NOT NULL AND TRIM(name) <> ''
            AND cnpj IS NOT NULL AND length(regexp_replace(cnpj, '\\D', '', 'g')) = 14
            AND "responsavelNome" IS NOT NULL AND TRIM("responsavelNome") <> ''
            AND "responsavelCpf" IS NOT NULL AND length(regexp_replace("responsavelCpf", '\\D', '', 'g')) = 11
            AND telefone IS NOT NULL AND TRIM(telefone) <> ''
            AND endereco IS NOT NULL AND length(TRIM(endereco)) >= 5
            ${excludeCompanyUserSql}
        `,
      ),
      countRaw(
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint AS count
          FROM "Company"
          WHERE "createdAt" >= ${baselineAt}
            AND "verificationStatus" = 'VERIFIED'
            ${excludeCompanyUserSql}
        `,
      ),
      countRaw(
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint AS count
          FROM "Company"
          WHERE "verificationStatus" = 'PENDING'
            AND "cartaoCnpjUrl" IS NOT NULL
            AND TRIM("cartaoCnpjUrl") <> ''
            AND "createdAt" >= ${baselineAt}
            ${excludeCompanyUserSql}
        `,
      ),
      prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM "SiteVisit"
        WHERE "createdAt" >= ${seriesSince}
        GROUP BY 1
        ORDER BY 1
      `.catch(() => [] as Array<{ day: Date; count: bigint }>),
      prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM "User"
        WHERE role = 'PROFESSIONAL' AND "createdAt" >= ${seriesSince}
          ${excludeUserSql}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM "User"
        WHERE role = 'COMPANY' AND "createdAt" >= ${seriesSince}
          ${excludeUserSql}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<Array<{ planTier: string | null; subscriptionExpiresAt: Date | null; count: bigint }>>`
        SELECT "planTier", "subscriptionExpiresAt", COUNT(*)::bigint AS count
        FROM "Company"
        WHERE "createdAt" >= ${baselineAt}
          ${excludeCompanyUserSql}
        GROUP BY "planTier", "subscriptionExpiresAt"
      `.catch(
        () =>
          [] as Array<{
            planTier: string | null;
            subscriptionExpiresAt: Date | null;
            count: bigint;
          }>,
      ),
      prisma.$queryRaw<
        Array<{
          contatados: bigint;
          entrevistados: bigint;
          testados: bigint;
          contratados: bigint;
          naoContratados: bigint;
        }>
      >`
        SELECT
          COUNT(*) FILTER (WHERE contatado = true)::bigint AS contatados,
          COUNT(*) FILTER (WHERE entrevistado = true)::bigint AS entrevistados,
          COUNT(*) FILTER (WHERE "emTeste" = true)::bigint AS testados,
          COUNT(*) FILTER (WHERE contratado = true)::bigint AS contratados,
          COUNT(*) FILTER (WHERE "naoContratado" = true)::bigint AS "naoContratados"
        FROM "CompanyProfileTracking"
        WHERE "createdAt" >= ${baselineAt}
          ${excludeTrackingCompanySql}
      `.catch(() => [
        {
          contatados: BigInt(0),
          entrevistados: BigInt(0),
          testados: BigInt(0),
          contratados: BigInt(0),
          naoContratados: BigInt(0),
        },
      ]),
      prisma.paymentRecord
        .findMany({
          where: { status: 'PAID', createdAt: { gte: baselineAt } },
          select: { amount: true, customer: true, createdAt: true },
        })
        .catch(
          () =>
            [] as Array<{ amount: number; customer: string | null; createdAt: Date }>,
        ),
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
        revenueLabel: `R$ ${(revenueCentavos / 100).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
        })}`,
      };
    });

    const plansRevenueTotalCentavos = paidPlans.reduce(
      (sum, p) => sum + p.revenueCentavos,
      0,
    );
    const tracking = trackingRows[0] || {
      contatados: BigInt(0),
      entrevistados: BigInt(0),
      testados: BigInt(0),
      contratados: BigInt(0),
      naoContratados: BigInt(0),
    };

    const { collectedCentavos, collectedPayments } = sumPaidExcludingTestEmails(
      paidPayments,
      excludeEmails,
      baselineAt,
    );
    const formatBrlFromCentavos = (centavos: number) =>
      `R$ ${(centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    return NextResponse.json({
      site: {
        visits: {
          total: visitsTotal,
          today: visitsToday,
          week: visitsWeek,
          month: visitsMonth,
        },
        sessions: {
          total: sessionsTotal,
          today: sessionsToday,
          week: sessionsWeek,
          month: sessionsMonth,
        },
        googleAccounts: {
          total: googleTotal,
          today: googleToday,
          week: googleWeek,
          month: googleMonth,
        },
      },
      professionals: {
        cadastros: {
          total: proTotal,
          today: proToday,
          week: proWeek,
          month: proMonth,
        },
        profilesComplete: proProfilesComplete,
        profilesActive: proProfilesActive,
      },
      companies: {
        cadastros: {
          total: companyTotal,
          today: companyToday,
          week: companyWeek,
          month: companyMonth,
        },
        profilesComplete: companyComplete,
        profilesActive: companyActiveVerified,
        pendingCnpj: companiesPending,
      },
      totals: {
        visits: visitsTotal,
        uniqueSessions: sessionsTotal,
        visitsToday,
        professionals: proTotal,
        companies: companyTotal,
        profilesActive: proProfilesActive,
        companiesPending,
        freeCompanies: planCounts.FREE,
        contatados: Number(tracking.contatados || 0),
        entrevistados: Number(tracking.entrevistados || 0),
        testados: Number(tracking.testados || 0),
        contratados: Number(tracking.contratados || 0),
        naoContratados: Number(tracking.naoContratados || 0),
        excludedTestAccounts: excludeIds.length,
        adminAccounts: adminEmails.length,
        statsSince: baselineAt.toISOString(),
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
