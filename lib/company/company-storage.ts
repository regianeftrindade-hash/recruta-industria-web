import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import type { CompanyPlanTier } from '@/lib/company-premium-plans';
import type { BillingPeriod } from '@/lib/billing';
import { getSubscriptionDays } from '@/lib/billing';
import {
  applyCompanySubscriptionBilling,
  type ApplySubscriptionOptions,
} from '@/lib/subscription-billing-storage';

export type CompanyExtraData = {
  cnpj: string | null;
  responsavelNome: string | null;
  responsavelCpf: string | null;
};

export async function findCompanyByCnpj(
  cnpj: string,
  excludeUserId?: string
): Promise<{ id: string; userId: string } | null> {
  const rows = excludeUserId
    ? await prisma.$queryRaw<Array<{ id: string; userId: string }>>`
        SELECT id, "userId" FROM "Company"
        WHERE cnpj = ${cnpj} AND "userId" != ${excludeUserId}
        LIMIT 1
      `
    : await prisma.$queryRaw<Array<{ id: string; userId: string }>>`
        SELECT id, "userId" FROM "Company"
        WHERE cnpj = ${cnpj}
        LIMIT 1
      `;

  return rows[0] ?? null;
}

export async function findCompanyByResponsavelCpf(
  cpf: string,
  excludeUserId?: string
): Promise<{ id: string; userId: string } | null> {
  const rows = excludeUserId
    ? await prisma.$queryRaw<Array<{ id: string; userId: string }>>`
        SELECT id, "userId" FROM "Company"
        WHERE "responsavelCpf" = ${cpf} AND "userId" != ${excludeUserId}
        LIMIT 1
      `
    : await prisma.$queryRaw<Array<{ id: string; userId: string }>>`
        SELECT id, "userId" FROM "Company"
        WHERE "responsavelCpf" = ${cpf}
        LIMIT 1
      `;

  return rows[0] ?? null;
}

export async function saveCompanyExtraData(
  userId: string,
  data: { cnpj?: string; responsavelNome?: string; responsavelCpf?: string }
): Promise<void> {
  if (data.cnpj !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET cnpj = ${data.cnpj}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  if (data.responsavelNome !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET "responsavelNome" = ${data.responsavelNome}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  if (data.responsavelCpf !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET "responsavelCpf" = ${data.responsavelCpf}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }
}

export async function getCompanyExtraData(userId: string): Promise<CompanyExtraData> {
  const rows = await prisma.$queryRaw<Array<CompanyExtraData>>`
    SELECT cnpj, "responsavelNome", "responsavelCpf"
    FROM "Company"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;

  return rows[0] ?? { cnpj: null, responsavelNome: null, responsavelCpf: null };
}

export async function getCompanyCnpj(userId: string): Promise<string | null> {
  const data = await getCompanyExtraData(userId);
  return data.cnpj;
}

export async function saveCompanyCnpj(userId: string, cnpj: string): Promise<void> {
  await saveCompanyExtraData(userId, { cnpj });
}

export async function getCompanyPlanTier(userId: string): Promise<CompanyPlanTier> {
  const rows = await prisma.$queryRaw<
    Array<{ planTier: string | null; subscriptionExpiresAt: Date | null }>
  >`
    SELECT "planTier", "subscriptionExpiresAt"
    FROM "Company"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;

  const row = rows[0];
  const tier = row?.planTier;
  const expiresAt = row?.subscriptionExpiresAt;

  if (
    tier === 'BASIC' ||
    tier === 'PREMIUM' ||
    tier === 'EMPRESARIAL'
  ) {
    if (expiresAt && expiresAt.getTime() < Date.now()) {
      await setCompanyPlanTier(userId, 'FREE');
      return 'FREE';
    }
    return tier;
  }

  return 'FREE';
}

export async function setCompanyPlanTier(
  userId: string,
  planTier: CompanyPlanTier,
  billing?: ApplySubscriptionOptions & { billingPeriod?: BillingPeriod },
): Promise<void> {
  const period = billing?.billingPeriod ?? 'monthly';
  const days = getSubscriptionDays(period);
  const expiresAt = planTier === 'FREE'
    ? null
    : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await prisma.$executeRaw`
    UPDATE "Company"
    SET "planTier" = ${planTier},
        "subscriptionExpiresAt" = ${expiresAt},
        "updatedAt" = NOW()
    WHERE "userId" = ${userId}
  `;

  if (planTier !== 'FREE' && billing) {
    await applyCompanySubscriptionBilling(userId, {
      ...billing,
      billingPeriod: period,
      extendFromCurrent: billing.extendFromCurrent,
    });
  }
}

export async function countCompanyFavorites(companyUserId: string): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "CompanyFavorite"
    WHERE "companyUserId" = ${companyUserId}
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function listCompanyFavoriteProfileIds(
  companyUserId: string,
  limit = 100
): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ profileId: string }>>`
    SELECT "profileId"
    FROM "CompanyFavorite"
    WHERE "companyUserId" = ${companyUserId}
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => r.profileId);
}

export async function hasCompanyFavorite(
  companyUserId: string,
  profileId: string
): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "CompanyFavorite"
    WHERE "companyUserId" = ${companyUserId} AND "profileId" = ${profileId}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function createCompanyFavorite(
  companyUserId: string,
  profileId: string
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "CompanyFavorite" (id, "companyUserId", "profileId", "createdAt")
    VALUES (${randomUUID()}, ${companyUserId}, ${profileId}, NOW())
    ON CONFLICT ("companyUserId", "profileId") DO NOTHING
  `;
}

export async function deleteCompanyFavorite(
  companyUserId: string,
  profileId: string
): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM "CompanyFavorite"
    WHERE "companyUserId" = ${companyUserId} AND "profileId" = ${profileId}
  `;
}

export type CompanySearchHistoryRow = {
  id: string;
  filtersJSON: string;
  createdAt: Date;
};

export async function listCompanySearchHistory(
  companyUserId: string,
  limit = 10
): Promise<CompanySearchHistoryRow[]> {
  return prisma.$queryRaw<CompanySearchHistoryRow[]>`
    SELECT id, "filtersJSON", "createdAt"
    FROM "CompanySearchHistory"
    WHERE "companyUserId" = ${companyUserId}
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `;
}

export async function createCompanySearchHistory(
  companyUserId: string,
  filtersJSON: string
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "CompanySearchHistory" (id, "companyUserId", "filtersJSON", "createdAt")
    VALUES (${randomUUID()}, ${companyUserId}, ${filtersJSON}, NOW())
  `;
}
