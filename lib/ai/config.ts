import type { AiAccess, AiAudience, AiCapabilityTier, AiAssistantMode } from "@/lib/ai/types";
import {
  getAiUnavailableMessage,
  isAiConfigured,
  isAiFeatureEnabled,
} from "@/lib/openai";
import type { CompanyPlanTier } from "@/lib/company/company-premium-plans";
import { getPlanFeatures } from "@/lib/company/company-plan";

export {
  getOpenAiApiKey,
  getOpenAiModel,
  isAiConfigured,
  isAiFeatureEnabled,
  isOpenAiConfigured,
  getAiUnavailableMessage,
} from "@/lib/openai";

/** Feature flag global (servidor) — alias de isAiFeatureEnabled. */
export function isAiEnabledServer(): boolean {
  return isAiFeatureEnabled();
}

/**
 * Limites mensais por capacidade da IA.
 * Capacidade ≠ plano: o plano da empresa continua sendo Company.planTier
 * (FREE | BASIC | PREMIUM | EMPRESARIAL) via getCompanyPlanTier.
 */
export const AI_MONTHLY_LIMITS: Record<AiCapabilityTier, number> = {
  professional_basic: 20,
  company_basic: 5,
  company_premium: 400,
};

/** Proteção anti-abuso: requisições por janela curta (por usuário). */
export const AI_RATE_LIMIT = {
  maxPerMinute: 6,
  maxMessageChars: 2000,
  maxContextChars: 8000,
} as const;

function asCompanyPlanTier(value: string | null | undefined): CompanyPlanTier {
  const tier = String(value || "FREE").toUpperCase();
  if (tier === "BASIC" || tier === "PREMIUM" || tier === "EMPRESARIAL" || tier === "FREE") {
    return tier;
  }
  return "FREE";
}

/**
 * Resolve o nível de IA a partir do papel e do plano **já existente**.
 *
 * Empresa: lê Company.planTier (via getCompanyPlanTier) e aplica getPlanFeatures:
 * - FREE / BASIC → IA básica (busca/filtros)
 * - PREMIUM / EMPRESARIAL → IA completa (canUseAiPremium)
 *
 * Não usa as tabelas scaffold Plan/Subscription.
 */
export function resolveAiCapability(params: {
  role: string;
  companyPlanTier?: CompanyPlanTier | string | null;
  professionalPlanTier?: string | null;
}): {
  audience: AiAudience;
  capability: AiCapabilityTier;
  mode: AiAssistantMode;
  planLabel: string;
  companyPlanTier: CompanyPlanTier | null;
  premiumAiUnlocked: boolean;
} {
  const role = String(params.role || "").toUpperCase();

  if (role === "COMPANY") {
    const companyPlanTier = asCompanyPlanTier(params.companyPlanTier);
    const features = getPlanFeatures(companyPlanTier);
    const premiumAiUnlocked = features.canUseAiPremium;

    if (premiumAiUnlocked) {
      return {
        audience: "COMPANY",
        capability: "company_premium",
        mode: "recruitment",
        planLabel: companyPlanTier,
        companyPlanTier,
        premiumAiUnlocked: true,
      };
    }

    return {
      audience: "COMPANY",
      capability: "company_basic",
      mode: "search_basic",
      planLabel: companyPlanTier,
      companyPlanTier,
      premiumAiUnlocked: false,
    };
  }

  return {
    audience: "PROFESSIONAL",
    capability: "professional_basic",
    mode: "profile_help",
    planLabel: String(params.professionalPlanTier || "FREE").toUpperCase(),
    companyPlanTier: null,
    premiumAiUnlocked: false,
  };
}

export function buildAiAccess(params: {
  role: string;
  companyPlanTier?: CompanyPlanTier | string | null;
  professionalPlanTier?: string | null;
}): AiAccess {
  const resolved = resolveAiCapability(params);
  const monthlyLimit = AI_MONTHLY_LIMITS[resolved.capability];

  if (!isAiConfigured()) {
    return {
      ...resolved,
      monthlyLimit,
      enabled: false,
      reasonDisabled: getAiUnavailableMessage(),
    };
  }

  return {
    ...resolved,
    monthlyLimit,
    enabled: true,
  };
}
