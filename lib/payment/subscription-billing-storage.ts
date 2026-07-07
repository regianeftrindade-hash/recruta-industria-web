import { prisma } from '@/lib/db';
import type { BillingMode, BillingPeriod } from '@/lib/billing';
import { ensureSubscriptionBillingColumns } from '@/lib/ensure-db-schema';
import { getSubscriptionDays } from '@/lib/billing';

export type SubscriptionBillingState = {
  billingPeriod: BillingPeriod;
  billingMode: BillingMode;
  autoRenew: boolean;
  gatewaySubscriptionId: string | null;
  subscriptionExpiresAt: Date | null;
};

export type ApplySubscriptionOptions = {
  billingPeriod?: BillingPeriod;
  billingMode?: BillingMode;
  autoRenew?: boolean;
  gatewaySubscriptionId?: string | null;
  extendFromCurrent?: boolean;
};

function computeExpiresAt(
  currentExpiresAt: Date | null | undefined,
  period: BillingPeriod,
  extendFromCurrent: boolean,
): Date {
  const days = getSubscriptionDays(period);
  const base = extendFromCurrent && currentExpiresAt && currentExpiresAt.getTime() > Date.now()
    ? currentExpiresAt.getTime()
    : Date.now();
  return new Date(base + days * 24 * 60 * 60 * 1000);
}

export async function applyCompanySubscriptionBilling(
  userId: string,
  options: ApplySubscriptionOptions,
): Promise<void> {
  await ensureSubscriptionBillingColumns();

  const period = options.billingPeriod ?? 'monthly';
  const mode = options.billingMode ?? 'one_time';
  const autoRenew = options.autoRenew ?? mode === 'recurring';

  const rows = await prisma.$queryRaw<Array<{ subscriptionExpiresAt: Date | null }>>`
    SELECT "subscriptionExpiresAt"
    FROM "Company"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;

  const expiresAt = computeExpiresAt(
    rows[0]?.subscriptionExpiresAt,
    period,
    Boolean(options.extendFromCurrent),
  );

  await prisma.$executeRaw`
    UPDATE "Company"
    SET "billingPeriod" = ${period},
        "billingMode" = ${mode},
        "autoRenew" = ${autoRenew},
        "gatewaySubscriptionId" = ${options.gatewaySubscriptionId ?? null},
        "subscriptionExpiresAt" = ${expiresAt},
        "updatedAt" = NOW()
    WHERE "userId" = ${userId}
  `;
}

export async function applyProfessionalSubscriptionBilling(
  userId: string,
  options: ApplySubscriptionOptions,
): Promise<void> {
  await ensureSubscriptionBillingColumns();

  const period = options.billingPeriod ?? 'monthly';
  const mode = options.billingMode ?? 'one_time';
  const autoRenew = options.autoRenew ?? mode === 'recurring';

  const rows = await prisma.$queryRaw<Array<{ subscriptionExpiresAt: Date | null }>>`
    SELECT "subscriptionExpiresAt"
    FROM "Profile"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;

  const expiresAt = computeExpiresAt(
    rows[0]?.subscriptionExpiresAt,
    period,
    Boolean(options.extendFromCurrent),
  );

  await prisma.$executeRaw`
    UPDATE "Profile"
    SET "billingPeriod" = ${period},
        "billingMode" = ${mode},
        "autoRenew" = ${autoRenew},
        "gatewaySubscriptionId" = ${options.gatewaySubscriptionId ?? null},
        "subscriptionExpiresAt" = ${expiresAt},
        "updatedAt" = NOW()
    WHERE "userId" = ${userId}
  `;
}

export async function getCompanySubscriptionBilling(
  userId: string,
): Promise<SubscriptionBillingState | null> {
  await ensureSubscriptionBillingColumns();
  const rows = await prisma.$queryRaw<Array<{
    billingPeriod: string | null;
    billingMode: string | null;
    autoRenew: boolean | null;
    gatewaySubscriptionId: string | null;
    subscriptionExpiresAt: Date | null;
  }>>`
    SELECT "billingPeriod", "billingMode", "autoRenew", "gatewaySubscriptionId", "subscriptionExpiresAt"
    FROM "Company"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    billingPeriod: row.billingPeriod === 'annual' ? 'annual' : 'monthly',
    billingMode: row.billingMode === 'recurring' ? 'recurring' : 'one_time',
    autoRenew: Boolean(row.autoRenew),
    gatewaySubscriptionId: row.gatewaySubscriptionId,
    subscriptionExpiresAt: row.subscriptionExpiresAt,
  };
}

export async function getProfessionalSubscriptionBilling(
  userId: string,
): Promise<SubscriptionBillingState | null> {
  await ensureSubscriptionBillingColumns();
  const rows = await prisma.$queryRaw<Array<{
    billingPeriod: string | null;
    billingMode: string | null;
    autoRenew: boolean | null;
    gatewaySubscriptionId: string | null;
    subscriptionExpiresAt: Date | null;
  }>>`
    SELECT "billingPeriod", "billingMode", "autoRenew", "gatewaySubscriptionId", "subscriptionExpiresAt"
    FROM "Profile"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    billingPeriod: row.billingPeriod === 'annual' ? 'annual' : 'monthly',
    billingMode: row.billingMode === 'recurring' ? 'recurring' : 'one_time',
    autoRenew: Boolean(row.autoRenew),
    gatewaySubscriptionId: row.gatewaySubscriptionId,
    subscriptionExpiresAt: row.subscriptionExpiresAt,
  };
}
