/**
 * Autorização server-side para recursos de IA.
 * Plano sempre lido do banco (Company.planTier) — nunca do client.
 */

import { prisma } from "@/lib/db";
import {
  getAiUnavailableMessage,
  isAiConfigured,
  isAiFeatureEnabled,
  isOpenAiConfigured,
} from "@/lib/openai";
import { resolveAiUser, type ResolvedAiUser } from "@/lib/ai/assistant";
import { AI_RESOURCE_META, type AiResource } from "@/lib/ai/resources";
import { getResourceMonthlyLimit } from "@/lib/ai/limits";
import { countResourceUsage, logAiUsageEvent } from "@/lib/ai/usage-events";
import { AiServiceError } from "@/lib/ai/errors";
import { assertRateLimit } from "@/lib/ai/usage";
import type { CompanyPlanTier } from "@/lib/company/company-premium-plans";
import { getPlanFeatures } from "@/lib/company/company-plan";

export type AiActor = ResolvedAiUser & {
  companyPlanTier: CompanyPlanTier | null;
};

export async function resolveAiActor(params: {
  userId: string;
  email: string;
  role: string;
}): Promise<AiActor> {
  const resolved = await resolveAiUser(params);
  return {
    ...resolved,
    companyPlanTier: resolved.access.companyPlanTier,
  };
}

export async function loadUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true, role: true },
  });
}

/**
 * Valida feature flag, autenticação, papel, plano (servidor) e limite do recurso.
 * Ordem: flag → papel → plano → limite → implementado.
 */
export async function assertAiResourceAccess(params: {
  actor: AiActor;
  resource: AiResource;
}): Promise<{ limit: number; used: number; remaining: number }> {
  const meta = AI_RESOURCE_META[params.resource];

  if (!isAiFeatureEnabled()) {
    await logAiUsageEvent({
      userId: params.actor.userId,
      companyOwnerUserId: params.actor.companyOwnerUserId,
      resource: params.resource,
      status: "disabled",
      errorCode: "AI_DISABLED",
    });
    throw new AiServiceError("AI_DISABLED", getAiUnavailableMessage(), 200);
  }

  if (!isOpenAiConfigured() || !isAiConfigured()) {
    await logAiUsageEvent({
      userId: params.actor.userId,
      companyOwnerUserId: params.actor.companyOwnerUserId,
      resource: params.resource,
      status: "disabled",
      errorCode: "AI_NOT_CONFIGURED",
    });
    throw new AiServiceError("AI_NOT_CONFIGURED", getAiUnavailableMessage(), 200);
  }

  if (meta.audience === "PROFESSIONAL") {
    if (params.actor.role !== "PROFESSIONAL") {
      throw new AiServiceError(
        "AI_FORBIDDEN_ROLE",
        "Este recurso de IA é exclusivo de profissionais (próprio perfil).",
        403,
      );
    }
  }

  if (meta.audience === "COMPANY_PREMIUM") {
    if (params.actor.role !== "COMPANY") {
      throw new AiServiceError(
        "AI_FORBIDDEN_ROLE",
        "Este recurso de IA é exclusivo de empresas.",
        403,
      );
    }
    const tier = params.actor.companyPlanTier || "FREE";
    const features = getPlanFeatures(tier);
    if (!features.canUseAiPremium) {
      await logAiUsageEvent({
        userId: params.actor.userId,
        companyOwnerUserId: params.actor.companyOwnerUserId,
        resource: params.resource,
        status: "denied",
        errorCode: "AI_FORBIDDEN_PLAN",
      });
      throw new AiServiceError(
        "AI_FORBIDDEN_PLAN",
        "Empresas no plano gratuito/básico não têm acesso aos recursos avançados de IA. Plano atual: " +
          tier +
          ". Disponível em PREMIUM e EMPRESARIAL.",
        403,
        { companyPlanTier: tier, premiumAiUnlocked: false },
      );
    }
  }

  if (!meta.implemented) {
    throw new AiServiceError(
      "AI_NOT_IMPLEMENTED",
      `O recurso "${meta.label}" ainda não está disponível. Em breve.`,
      501,
    );
  }

  try {
    assertRateLimit(params.actor.userId);
  } catch {
    throw new AiServiceError(
      "AI_RATE_LIMIT",
      "Muitas solicitações. Aguarde um minuto e tente de novo.",
      429,
    );
  }

  const limit = getResourceMonthlyLimit({
    resource: params.resource,
    role: params.actor.role === "COMPANY" ? "COMPANY" : "PROFESSIONAL",
    companyPlanTier: params.actor.companyPlanTier,
  });

  if (limit <= 0) {
    throw new AiServiceError(
      "AI_FORBIDDEN_RESOURCE",
      "Seu plano não inclui este recurso de IA.",
      403,
      { limit: 0 },
    );
  }

  const used = await countResourceUsage({
    userId: params.actor.userId,
    resource: params.resource,
  });

  if (used >= limit) {
    await logAiUsageEvent({
      userId: params.actor.userId,
      companyOwnerUserId: params.actor.companyOwnerUserId,
      resource: params.resource,
      status: "limit",
      errorCode: "AI_MONTHLY_LIMIT",
    });
    throw new AiServiceError(
      "AI_MONTHLY_LIMIT",
      "Limite mensal deste recurso de IA atingido.",
      429,
      { used, limit, remaining: 0 },
    );
  }

  return { limit, used, remaining: Math.max(0, limit - used) };
}
