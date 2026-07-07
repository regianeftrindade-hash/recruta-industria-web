import { prisma } from '@/lib/db';
import type { ProfessionalPlanTier } from '@/lib/professional-premium-plans';
import { ensureProfilePremiumColumns } from '@/lib/ensure-db-schema';
import type { BillingPeriod } from '@/lib/billing';
import { getSubscriptionDays } from '@/lib/billing';
import {
  applyProfessionalSubscriptionBilling,
  type ApplySubscriptionOptions,
} from '@/lib/subscription-billing-storage';

export async function getProfessionalPlanTier(userId: string): Promise<ProfessionalPlanTier> {
  try {
    await ensureProfilePremiumColumns();

    const rows = await prisma.$queryRaw<
      Array<{ planTier: string | null; subscriptionExpiresAt: Date | null }>
    >`
      SELECT "planTier", "subscriptionExpiresAt"
      FROM "Profile"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;

    const row = rows[0];
    const tier = row?.planTier;
    const expiresAt = row?.subscriptionExpiresAt;

    if (tier === 'PREMIUM') {
      if (expiresAt && expiresAt.getTime() < Date.now()) {
        await setProfessionalPlanTier(userId, 'FREE');
        return 'FREE';
      }
      return 'PREMIUM';
    }

    return 'FREE';
  } catch (error) {
    console.warn('[premium] getProfessionalPlanTier fallback FREE:', error);
    return 'FREE';
  }
}

export async function setProfessionalPlanTier(
  userId: string,
  planTier: ProfessionalPlanTier,
  billing?: ApplySubscriptionOptions & { billingPeriod?: BillingPeriod },
): Promise<void> {
  await ensureProfilePremiumColumns();

  const period = billing?.billingPeriod ?? 'monthly';
  const days = getSubscriptionDays(period);
  const expiresAt = planTier === 'FREE'
    ? null
    : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await prisma.$executeRaw`
    UPDATE "Profile"
    SET "planTier" = ${planTier},
        "subscriptionExpiresAt" = ${expiresAt},
        "updatedAt" = NOW()
    WHERE "userId" = ${userId}
  `;

  if (planTier !== 'FREE' && billing) {
    await applyProfessionalSubscriptionBilling(userId, {
      ...billing,
      billingPeriod: period,
      extendFromCurrent: billing.extendFromCurrent,
    });
  }
}

/** Perfis com Premium ativo (para destaque na vitrine). */
export async function listActivePremiumProfileIds(profileIds: string[]): Promise<Set<string>> {
  if (profileIds.length === 0) return new Set();

  try {
    await ensureProfilePremiumColumns();

    const allowed = new Set(profileIds);
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM "Profile"
      WHERE "planTier" = 'PREMIUM'
        AND ("subscriptionExpiresAt" IS NULL OR "subscriptionExpiresAt" > NOW())
    `;

    return new Set(rows.map((r) => r.id).filter((id) => allowed.has(id)));
  } catch (error) {
    console.warn('[premium] listActivePremiumProfileIds fallback vazio:', error);
    return new Set();
  }
}
