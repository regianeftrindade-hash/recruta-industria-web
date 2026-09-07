/** Tipos do assistente Recruta Indústria */

import type { CompanyPlanTier } from "@/lib/company/company-premium-plans";

export type AiAudience = "PROFESSIONAL" | "COMPANY";

/**
 * Capacidade operacional da IA (limites/prompts) — NÃO é um plano de pagamento.
 * O plano da empresa continua sendo Company.planTier (FREE|BASIC|PREMIUM|EMPRESARIAL).
 */
export type AiCapabilityTier = "professional_basic" | "company_basic" | "company_premium";

export type AiAssistantMode =
  | "profile_help" // profissional: perfil / texto / navegação
  | "search_basic" // empresa FREE/BASIC: frase → filtros básicos
  | "recruitment"; // empresa PREMIUM/EMPRESARIAL: recrutamento completo

export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiAccess = {
  audience: AiAudience;
  capability: AiCapabilityTier;
  mode: AiAssistantMode;
  monthlyLimit: number;
  /** Espelho do plano existente (Company.planTier ou Profile.planTier) */
  planLabel: string;
  /** Plano empresa atual (Company.planTier); null para profissional */
  companyPlanTier: CompanyPlanTier | null;
  /** true somente se getPlanFeatures(...).canUseAiPremium */
  premiumAiUnlocked: boolean;
  enabled: boolean;
  reasonDisabled?: string;
};

export type AiUsageSnapshot = {
  periodKey: string;
  used: number;
  limit: number;
  remaining: number;
};

export type AiAssistantRequest = {
  message: string;
  conversationId?: string | null;
  /** Contexto opcional (filtros atuais, trecho do perfil, etc.) — nunca inventar além disso */
  context?: Record<string, unknown> | null;
};

export type AiAssistantResponse = {
  reply: string;
  conversationId: string | null;
  usage: AiUsageSnapshot;
  capability: AiCapabilityTier;
  mode: AiAssistantMode;
  /** false quando a IA está desligada / sem chave / indisponível */
  available: boolean;
  /** Sugestões estruturadas (ex.: filtros), quando a IA retornar JSON auxiliar */
  structured?: Record<string, unknown> | null;
};
