import { prisma } from '@/lib/db';
import type { ProfessionalPlanTier } from '@/lib/professional-premium-plans';
import { getProfessionalPlanDefinition } from '@/lib/professional-premium-plans';
import { getProfessionalPlanTier } from '@/lib/professional-storage';
import { ensureProfilePremiumColumns } from '@/lib/ensure-db-schema';

export interface ProfessionalPlanFeatures {
  canSeeCompanyNames: boolean;
  isFeaturedInSearch: boolean;
  canAccessDetailedReports: boolean;
  canReceiveEmailNotifications: boolean;
}

export interface ProfessionalPlanContext {
  tier: ProfessionalPlanTier;
  isPremium: boolean;
  subscriptionExpiresAt: Date | null;
  plan: ReturnType<typeof getProfessionalPlanDefinition>;
  features: ProfessionalPlanFeatures;
}

export function getProfessionalPlanFeatures(tier: ProfessionalPlanTier): ProfessionalPlanFeatures {
  const isPremium = tier === 'PREMIUM';

  return {
    canSeeCompanyNames: isPremium,
    isFeaturedInSearch: isPremium,
    canAccessDetailedReports: isPremium,
    canReceiveEmailNotifications: isPremium,
  };
}

export async function getProfessionalPlanContext(userId: string): Promise<ProfessionalPlanContext> {
  const tier = await getProfessionalPlanTier(userId);

  let subscriptionExpiresAt: Date | null = null;
  try {
    await ensureProfilePremiumColumns();
    const rows = await prisma.$queryRaw<Array<{ subscriptionExpiresAt: Date | null }>>`
      SELECT "subscriptionExpiresAt"
      FROM "Profile"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;
    subscriptionExpiresAt = rows[0]?.subscriptionExpiresAt ?? null;
  } catch {
    subscriptionExpiresAt = null;
  }

  return {
    tier,
    isPremium: tier === 'PREMIUM',
    subscriptionExpiresAt,
    plan: getProfessionalPlanDefinition(tier),
    features: getProfessionalPlanFeatures(tier),
  };
}
