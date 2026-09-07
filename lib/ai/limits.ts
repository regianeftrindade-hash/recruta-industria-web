/**
 * Limites mensais por recurso e por plano existente (Company.planTier / profissional).
 * Configurável — sem novas tabelas de plano.
 */

import type { CompanyPlanTier } from "@/lib/company/company-premium-plans";
import type { AiResource } from "@/lib/ai/resources";

/** Limite mensal (requests) por recurso para profissional. */
export const AI_PROFESSIONAL_RESOURCE_LIMITS: Record<AiResource, number> = {
  improve_presentation: 20,
  improve_experience: 20,
  explain_incomplete_fields: 20,
  summarize_professional: 0,
  compare_professionals: 0,
  interview_questions: 0,
  search_to_filters: 0,
};

/**
 * Limites empresa por Company.planTier existente.
 * FREE/BASIC: 0 nos recursos avançados (Premium only).
 */
export const AI_COMPANY_RESOURCE_LIMITS: Record<
  CompanyPlanTier,
  Partial<Record<AiResource, number>>
> = {
  FREE: {
    summarize_professional: 0,
    compare_professionals: 0,
    interview_questions: 0,
    search_to_filters: 0,
  },
  BASIC: {
    summarize_professional: 0,
    compare_professionals: 0,
    interview_questions: 0,
    search_to_filters: 0,
  },
  PREMIUM: {
    summarize_professional: 100,
    compare_professionals: 50,
    interview_questions: 80,
    search_to_filters: 100,
  },
  EMPRESARIAL: {
    summarize_professional: 400,
    compare_professionals: 200,
    interview_questions: 200,
    search_to_filters: 400,
  },
};

/** Estimativa USD por 1M tokens (aprox. gpt-4o-mini) — só para telemetria. */
export const AI_COST_ESTIMATE_USD_PER_1M = {
  input: 0.15,
  output: 0.6,
} as const;

export function estimateCostCents(tokensIn: number, tokensOut: number): number {
  const usd =
    (Math.max(0, tokensIn) / 1_000_000) * AI_COST_ESTIMATE_USD_PER_1M.input +
    (Math.max(0, tokensOut) / 1_000_000) * AI_COST_ESTIMATE_USD_PER_1M.output;
  return Math.max(0, Math.round(usd * 100));
}

export function getResourceMonthlyLimit(params: {
  resource: AiResource;
  role: "PROFESSIONAL" | "COMPANY";
  companyPlanTier?: CompanyPlanTier | null;
}): number {
  if (params.role === "PROFESSIONAL") {
    return AI_PROFESSIONAL_RESOURCE_LIMITS[params.resource] ?? 0;
  }
  const tier = params.companyPlanTier || "FREE";
  return AI_COMPANY_RESOURCE_LIMITS[tier]?.[params.resource] ?? 0;
}
