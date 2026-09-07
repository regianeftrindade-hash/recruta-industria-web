import { prisma } from '@/lib/db';
import { countCompanyFavorites, getCompanyPlanTier, getCompanyVerificationInfo } from '@/lib/company-storage';
import type { CompanyPlanTier } from '@/lib/company-premium-plans';

export type CompanyPlanFeatures = {
  canSearch: boolean;
  canViewSummary: boolean;
  canViewContacts: boolean;
  canViewFullResume: boolean;
  canUseAdvancedFilters: boolean;
  canUnlockContacts: boolean;
  canFavorite: boolean;
  canSearchHistory: boolean;
  canSendTips: boolean;
  canSendProposals: boolean;
  canViewAvailability: boolean;
  canViewLastUpdate: boolean;
  canUseAlerts: boolean;
  canUseTalentBank: boolean;
  canExportProfiles: boolean;
  canViewDashboardStats: boolean;
  canContactRecruta: boolean;
  /** IA básica (busca/filtros) — todos os planos empresa, quando a feature estiver ligada */
  canUseAiBasic: boolean;
  /** IA completa de recrutamento — só PREMIUM e EMPRESARIAL (Company.planTier) */
  canUseAiPremium: boolean;
  unlimitedUnlocks: boolean;
  unlimitedFavorites: boolean;
  maxUnlocksPerMonth: number | null;
  maxFavorites: number | null;
  maxUsers: number | null;
};

const TIER_ORDER: CompanyPlanTier[] = ['FREE', 'BASIC', 'PREMIUM', 'EMPRESARIAL'];

function tierIndex(tier: CompanyPlanTier): number {
  return TIER_ORDER.indexOf(tier);
}

function hasMinTier(current: CompanyPlanTier, required: CompanyPlanTier): boolean {
  return tierIndex(current) >= tierIndex(required);
}

export function getPlanFeatures(tier: CompanyPlanTier): CompanyPlanFeatures {
  const isPaid = hasMinTier(tier, 'BASIC');
  const isPremium = hasMinTier(tier, 'PREMIUM');

  return {
    canSearch: true,
    canViewSummary: true,
    canViewContacts: isPaid,
    canViewFullResume: isPaid,
    canUseAdvancedFilters: isPaid,
    canUnlockContacts: isPaid,
    canFavorite: isPaid,
    canSearchHistory: isPaid,
    canSendTips: isPaid,
    canSendProposals: isPaid,
    canViewAvailability: isPaid,
    canViewLastUpdate: isPaid,
    canUseAlerts: isPremium,
    canUseTalentBank: isPremium,
    canExportProfiles: isPremium,
    canViewDashboardStats: isPaid,
    canContactRecruta: isPaid,
    // IA usa o mesmo Company.planTier — sem tabelas/enums de plano novos
    // FREE/BASIC: sem recursos avançados de IA (Premium only)
    canUseAiBasic: false,
    canUseAiPremium: isPremium,
    unlimitedUnlocks: isPremium,
    unlimitedFavorites: isPaid,
    maxUnlocksPerMonth: tier === 'BASIC' ? 150 : isPremium ? null : 0,
    maxFavorites: isPaid ? null : 0,
    // Assentos RH inclusos (Admin conta como 1): Basic 1 · Premium 2 · Empresarial 4
    // Acima disso: usuário extra pago (ver company-extra-seats)
    maxUsers: tier === 'BASIC' ? 1 : tier === 'PREMIUM' ? 2 : tier === 'EMPRESARIAL' ? 4 : 1,
  };
}

/** Atalho: IA Premium liberada pelo plano atual da empresa (PREMIUM ou EMPRESARIAL). */
export function companyPlanUnlocksPremiumAi(tier: CompanyPlanTier): boolean {
  return getPlanFeatures(tier).canUseAiPremium;
}

export function applyVerificationToFeatures(
  features: CompanyPlanFeatures,
  isVerified: boolean,
): CompanyPlanFeatures {
  if (isVerified) return features;

  return {
    ...features,
    canViewContacts: false,
    canViewFullResume: false,
    canUnlockContacts: false,
    canExportProfiles: false,
    canSendTips: false,
    canSendProposals: false,
    maxUnlocksPerMonth: 0,
  };
}

export async function getCompanyPlanContext(
  companyUserId: string,
  options?: {
    ownerUserId?: string;
    verification?: Awaited<ReturnType<typeof getCompanyVerificationInfo>>;
  },
) {
  const ownerUserId =
    options?.ownerUserId ||
    (await (async () => {
      const { resolveCompanyOwnerUserId } = await import('@/lib/company/company-team');
      return (await resolveCompanyOwnerUserId(companyUserId)) || companyUserId;
    })());

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const now = new Date();

  const [tier, verification, unlocksThisMonth, activeUnlocks, favoritesCount] = await Promise.all([
    getCompanyPlanTier(ownerUserId),
    options?.verification
      ? Promise.resolve(options.verification)
      : getCompanyVerificationInfo(ownerUserId),
    prisma.accessRecord.count({
      where: {
        companyUserId: ownerUserId,
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.accessRecord.count({
      where: {
        companyUserId: ownerUserId,
        status: 'ACTIVE',
        expiresAt: { gt: now },
      },
    }),
    countCompanyFavorites(ownerUserId),
  ]);

  const baseFeatures = getPlanFeatures(tier);
  const features = applyVerificationToFeatures(baseFeatures, verification.canAccessSensitiveProfiles);

  let unlocksRemaining: number | null = null;
  if (features.unlimitedUnlocks) {
    unlocksRemaining = null;
  } else if (features.maxUnlocksPerMonth === 0) {
    unlocksRemaining = 0;
  } else if (features.maxUnlocksPerMonth !== null) {
    unlocksRemaining = Math.max(0, features.maxUnlocksPerMonth - unlocksThisMonth);
  }

  let favoritesRemaining: number | null = null;
  if (features.unlimitedFavorites) {
    favoritesRemaining = null;
  } else if (features.maxFavorites !== null) {
    favoritesRemaining = Math.max(0, features.maxFavorites - favoritesCount);
  }

  return {
    ownerUserId,
    tier,
    features,
    verification,
    usage: {
      unlocksThisMonth,
      activeUnlocks,
      favoritesCount,
      unlocksRemaining,
      favoritesRemaining,
    },
  };
}

export function isAdvancedFilterKey(key: string): boolean {
  return [
    'escolaridade', 'situacaoProfissional', 'nivelOperacional', 'areaNivel',
    'disponibilidadeInicio', 'pretensaoSalarial', 'trabalhouIndustria',
    'segmentoIndustria', 'maquinaEquipamento', 'qualidadeProcesso', 'informatica',
    'possuiCNH', 'categoriaCNH', 'aceitaViagens', 'disponibilidadeMudanca',
    'cursoCertificacao', 'areaCurso', 'idioma',
  ].includes(key);
}
