import { prisma } from '@/lib/db';
import { countCompanyFavorites, getCompanyPlanTier } from '@/lib/company-storage';
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
  canViewAvailability: boolean;
  canViewLastUpdate: boolean;
  canUseAlerts: boolean;
  canUseTalentBank: boolean;
  canExportProfiles: boolean;
  canViewDashboardStats: boolean;
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
  const isEmpresarial = tier === 'EMPRESARIAL';

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
    canViewAvailability: isPaid,
    canViewLastUpdate: isPaid,
    canUseAlerts: isPremium,
    canUseTalentBank: isEmpresarial,
    canExportProfiles: isPremium,
    canViewDashboardStats: isPaid,
    unlimitedUnlocks: isPremium,
    unlimitedFavorites: isPremium,
    maxUnlocksPerMonth: tier === 'BASIC' ? 50 : isPremium ? null : 0,
    maxFavorites: tier === 'BASIC' ? 100 : isPremium ? null : 0,
    maxUsers: tier === 'BASIC' ? 1 : tier === 'PREMIUM' ? 5 : tier === 'EMPRESARIAL' ? null : 1,
  };
}

export async function getCompanyPlanContext(companyUserId: string) {
  const tier = await getCompanyPlanTier(companyUserId);
  const features = getPlanFeatures(tier);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const unlocksThisMonth = await prisma.accessRecord.count({
    where: {
      companyUserId,
      createdAt: { gte: startOfMonth },
    },
  });

  const activeUnlocks = await prisma.accessRecord.count({
    where: {
      companyUserId,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    },
  });

  const favoritesCount = await countCompanyFavorites(companyUserId);

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
    tier,
    features,
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
    'escolaridade', 'turno', 'recolocacao', 'experiencia', 'pretensaoSalarial',
    'segmentoIndustria', 'maquinaEquipamento', 'qualidadeProcesso', 'informatica',
    'possuiCNH', 'aceitaViagens', 'disponibilidadeMudanca', 'cursoCertificacao',
  ].includes(key);
}
