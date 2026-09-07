export type {
  AiAudience,
  AiCapabilityTier,
  AiAssistantMode,
  AiChatMessage,
  AiAccess,
  AiUsageSnapshot,
  AiAssistantRequest,
  AiAssistantResponse,
} from "@/lib/ai/types";

export {
  isAiEnabledServer,
  getOpenAiApiKey,
  getOpenAiModel,
  isAiConfigured,
  isAiFeatureEnabled,
  isOpenAiConfigured,
  getAiUnavailableMessage,
  AI_MONTHLY_LIMITS,
  AI_RATE_LIMIT,
  resolveAiCapability,
  buildAiAccess,
} from "@/lib/ai/config";

export { companyPlanUnlocksPremiumAi, getPlanFeatures } from "@/lib/company/company-plan";
export type { CompanyPlanTier } from "@/lib/company/company-premium-plans";

export { buildSystemPrompt, extractStructuredJson } from "@/lib/ai/prompts";
export { chatCompletion } from "@/lib/ai/client";
export {
  ensureAssistantUsageTable,
  currentPeriodKey,
  getUsageSnapshot,
  assertWithinMonthlyLimit,
  incrementUsage,
  assertRateLimit,
  sanitizeUserMessage,
  sanitizeContext,
} from "@/lib/ai/usage";

export { resolveAiUser, runAssistant } from "@/lib/ai/assistant";
export type { ResolvedAiUser } from "@/lib/ai/assistant";

export {
  createAiResponse,
  getAiReadiness,
  getOpenAiClient,
  AI_UNAVAILABLE_MESSAGES,
} from "@/lib/openai";

export { AI_RESOURCES, AI_RESOURCE_META } from "@/lib/ai/resources";
export type { AiResource } from "@/lib/ai/resources";
export {
  AI_PROFESSIONAL_RESOURCE_LIMITS,
  AI_COMPANY_RESOURCE_LIMITS,
  getResourceMonthlyLimit,
  estimateCostCents,
} from "@/lib/ai/limits";
export { scrubPii, stripSensitiveContext } from "@/lib/ai/sanitize";
export { assertAiResourceAccess, resolveAiActor } from "@/lib/ai/guard";
export { improveProfessionalPresentation } from "@/lib/ai/features/improve-presentation";
export { queryAiUsageForAdmin, logAiUsageEvent } from "@/lib/ai/usage-events";
export { isAiUiEnabled } from "@/lib/ai/public-flags";
export { AiServiceError, aiErrorToJson } from "@/lib/ai/errors";
