import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { buildAiAccess } from "@/lib/ai/config";
import { buildSystemPrompt, extractStructuredJson } from "@/lib/ai/prompts";
import { chatCompletion } from "@/lib/ai/client";
import {
  assertRateLimit,
  assertWithinMonthlyLimit,
  ensureAssistantUsageTable,
  getUsageSnapshot,
  incrementUsage,
  sanitizeContext,
  sanitizeUserMessage,
} from "@/lib/ai/usage";
import type { AiAccess, AiAssistantRequest, AiAssistantResponse, AiChatMessage } from "@/lib/ai/types";
import type { CompanyPlanTier } from "@/lib/company/company-premium-plans";
import { getCompanyPlanTier } from "@/lib/company/company-storage";
import { resolveCompanyOwnerUserId } from "@/lib/company/company-team";
import { getProfessionalPlanTier } from "@/lib/professional/professional-storage";

export type ResolvedAiUser = {
  userId: string;
  email: string;
  role: string;
  /** Dono da conta empresa (plano fica em Company.planTier do owner) */
  companyOwnerUserId: string | null;
  access: AiAccess;
};

/**
 * Resolve acesso à IA.
 * Empresa: usa o Company.planTier do administrador (owner), não cria plano novo.
 */
export async function resolveAiUser(params: {
  userId: string;
  email: string;
  role: string;
}): Promise<ResolvedAiUser> {
  let companyPlanTier: CompanyPlanTier | null = null;
  let professionalPlanTier: string | null = null;
  let companyOwnerUserId: string | null = null;

  if (params.role === "COMPANY") {
    try {
      companyOwnerUserId =
        (await resolveCompanyOwnerUserId(params.userId)) || params.userId;
      companyPlanTier = await getCompanyPlanTier(companyOwnerUserId);
    } catch {
      companyOwnerUserId = params.userId;
      companyPlanTier = "FREE";
    }
  } else if (params.role === "PROFESSIONAL") {
    try {
      professionalPlanTier = await getProfessionalPlanTier(params.userId);
    } catch {
      professionalPlanTier = "FREE";
    }
  }

  const access = buildAiAccess({
    role: params.role,
    companyPlanTier,
    professionalPlanTier,
  });

  return {
    userId: params.userId,
    email: params.email,
    role: params.role,
    companyOwnerUserId,
    access,
  };
}

async function loadConversationMessages(
  userId: string,
  conversationId: string | null | undefined,
): Promise<{ id: string | null; history: AiChatMessage[] }> {
  if (!conversationId) return { id: null, history: [] };
  await ensureAssistantUsageTable();

  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; messages: string; userId: string }>>(
    `SELECT id, messages, "userId" FROM "assistant_conversations"
     WHERE id = $1 LIMIT 1`,
    conversationId,
  );
  const row = rows[0];
  if (!row || row.userId !== userId) return { id: null, history: [] };

  try {
    const parsed = JSON.parse(row.messages || "[]") as AiChatMessage[];
    const history = Array.isArray(parsed)
      ? parsed.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      : [];
    return { id: row.id, history: history.slice(-12) };
  } catch {
    return { id: row.id, history: [] };
  }
}

async function saveConversation(params: {
  userId: string;
  conversationId: string | null;
  history: AiChatMessage[];
  model: string;
  titleHint: string;
}): Promise<string> {
  await ensureAssistantUsageTable();
  const messagesJson = JSON.stringify(params.history.slice(-20));
  const title = params.titleHint.slice(0, 80) || "Conversa";

  if (params.conversationId) {
    await prisma.$executeRawUnsafe(
      `UPDATE "assistant_conversations"
       SET messages = $1, model = $2, "updatedAt" = NOW()
       WHERE id = $3 AND "userId" = $4`,
      messagesJson,
      params.model,
      params.conversationId,
      params.userId,
    );
    return params.conversationId;
  }

  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "assistant_conversations" (id, "userId", title, messages, model, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    id,
    params.userId,
    title,
    messagesJson,
    params.model,
  );
  return id;
}

/**
 * Executa uma pergunta ao assistente com limites, prompts por plano e regras de segurança.
 * Se a IA estiver desligada ou sem chave, retorna mensagem amigável (available: false).
 */
export async function runAssistant(
  user: ResolvedAiUser,
  request: AiAssistantRequest,
): Promise<AiAssistantResponse> {
  const emptyUsage = await getUsageSnapshot(user.userId, user.access.capability).catch(() => ({
    periodKey: "",
    used: 0,
    limit: user.access.monthlyLimit,
    remaining: user.access.monthlyLimit,
  }));

  if (!user.access.enabled) {
    return {
      reply: user.access.reasonDisabled || "A assistente de IA ainda não está disponível.",
      conversationId: request.conversationId || null,
      usage: emptyUsage,
      capability: user.access.capability,
      mode: user.access.mode,
      available: false,
      structured: null,
    };
  }

  const message = sanitizeUserMessage(request.message);
  if (!message) {
    throw new Error("AI_EMPTY_MESSAGE");
  }

  assertRateLimit(user.userId);
  await assertWithinMonthlyLimit(user.userId, user.access.capability);

  const context = sanitizeContext(request.context ?? null);
  const { id: existingId, history } = await loadConversationMessages(
    user.userId,
    request.conversationId,
  );

  const system = buildSystemPrompt({
    capability: user.access.capability,
    mode: user.access.mode,
    planLabel: user.access.planLabel,
  });

  const userContent = context
    ? `${message}\n\n---\nContexto fornecido pela plataforma (use só estes dados; não invente):\n${JSON.stringify(context, null, 2)}`
    : message;

  const messages: AiChatMessage[] = [
    ...history,
    { role: "user", content: userContent },
  ];

  const result = await chatCompletion({ system, messages });

  if (!result.ok) {
    return {
      reply: result.content,
      conversationId: existingId,
      usage: emptyUsage,
      capability: user.access.capability,
      mode: user.access.mode,
      available: false,
      structured: null,
    };
  }

  await incrementUsage({
    userId: user.userId,
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
  });

  const nextHistory: AiChatMessage[] = [
    ...history,
    { role: "user", content: message },
    { role: "assistant", content: result.content },
  ];

  const conversationId = await saveConversation({
    userId: user.userId,
    conversationId: existingId,
    history: nextHistory,
    model: result.model,
    titleHint: message,
  });

  const usage = await getUsageSnapshot(user.userId, user.access.capability);

  return {
    reply: result.content,
    conversationId,
    usage,
    capability: user.access.capability,
    mode: user.access.mode,
    available: true,
    structured: extractStructuredJson(result.content),
  };
}
