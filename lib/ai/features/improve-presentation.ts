/**
 * Melhorar apresentação profissional (Profile.mensagemEmpresas).
 * Retorna sugestões — NÃO aplica no perfil (exige confirmação do usuário).
 */

import { prisma } from "@/lib/db";
import { createAiResponse } from "@/lib/openai";
import { AI_DECISION_BAN, scrubPii } from "@/lib/ai/sanitize";
import { assertAiResourceAccess, type AiActor } from "@/lib/ai/guard";
import { parseImprovePresentationBody } from "@/lib/ai/validate";
import { logAiUsageEvent } from "@/lib/ai/usage-events";
import { AiServiceError } from "@/lib/ai/errors";
import { AI_RESOURCE_META } from "@/lib/ai/resources";

const SYSTEM = `
Você é um assistente de escrita do Recruta Indústria para PROFISSIONAIS da indústria.
Tarefa: sugerir melhorias na apresentação profissional (mensagem para empresas).

Regras:
1. Não invente experiências, cargos, máquinas, cursos ou resultados que o texto não mencione.
2. Não peça nem use CPF, RG, telefone, e-mail, endereço ou dados sensíveis (sexo, religião, idade, orientação sexual, identidade de gênero).
3. ${AI_DECISION_BAN}
4. Responda em português do Brasil.
5. Devolva APENAS um JSON válido neste formato:
{"suggestions":["texto1","texto2","texto3"],"notes":"dicas curtas opcionais"}
Máximo 3 sugestões. Cada sugestão é o texto completo revisado (não um diff).
`.trim();

export type ImprovePresentationResult = {
  ok: true;
  available: true;
  original: string;
  suggestions: string[];
  notes: string | null;
  requiresConfirmation: true;
  usage: { used: number; limit: number; remaining: number };
  notice: string;
};

async function loadOwnPresentation(userId: string): Promise<string> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { mensagemEmpresas: true, bio: true },
  });
  return String(profile?.mensagemEmpresas || profile?.bio || "").trim();
}

function parseSuggestions(content: string): { suggestions: string[]; notes: string | null } {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { suggestions: [trimmed.slice(0, AI_RESOURCE_META.improve_presentation.maxInputChars)], notes: null };
  }
  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      suggestions?: unknown;
      notes?: unknown;
    };
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .map((s) => scrubPii(s.trim()).text.slice(0, AI_RESOURCE_META.improve_presentation.maxInputChars))
          .slice(0, 3)
      : [];
    const notes =
      typeof parsed.notes === "string" && parsed.notes.trim()
        ? scrubPii(parsed.notes.trim()).text.slice(0, 500)
        : null;
    return { suggestions, notes };
  } catch {
    return { suggestions: [trimmed.slice(0, 2000)], notes: null };
  }
}

export async function improveProfessionalPresentation(
  actor: AiActor,
  rawBody: unknown,
): Promise<ImprovePresentationResult> {
  const usageGate = await assertAiResourceAccess({
    actor,
    resource: "improve_presentation",
  });

  const body = parseImprovePresentationBody(rawBody);
  const fromProfile = await loadOwnPresentation(actor.userId);
  const original = scrubPii(body.text ?? fromProfile).text;

  if (!original) {
    throw new AiServiceError(
      "AI_VALIDATION",
      "Informe um texto de apresentação ou preencha a mensagem para empresas no perfil.",
      400,
    );
  }

  const userPrompt = [
    "Texto atual da apresentação profissional:",
    original,
    body.instruction ? `\nPedido do profissional: ${body.instruction}` : "",
    "\nGere até 3 versões melhoradas (clareza, português e impacto), sem inventar fatos.",
  ].join("\n");

  const ai = await createAiResponse({
    instructions: SYSTEM,
    input: userPrompt,
    temperature: 0.4,
  });

  if (!ai.ok) {
    await logAiUsageEvent({
      userId: actor.userId,
      companyOwnerUserId: null,
      resource: "improve_presentation",
      model: null,
      status: ai.errorCode === "AI_NOT_READY" ? "disabled" : "error",
      errorCode: ai.errorCode,
    });
    throw new AiServiceError(
      ai.errorCode === "AI_NOT_READY" ? "AI_DISABLED" : "AI_API_ERROR",
      ai.content,
      ai.errorCode === "AI_NOT_READY" ? 200 : 502,
    );
  }

  const { suggestions, notes } = parseSuggestions(ai.content);
  if (!suggestions.length) {
    await logAiUsageEvent({
      userId: actor.userId,
      resource: "improve_presentation",
      model: ai.model,
      tokensIn: ai.tokensIn,
      tokensOut: ai.tokensOut,
      status: "error",
      errorCode: "OPENAI_EMPTY_REPLY",
    });
    throw new AiServiceError(
      "AI_API_ERROR",
      "A IA não retornou sugestões úteis. Tente novamente.",
      502,
    );
  }

  await logAiUsageEvent({
    userId: actor.userId,
    companyOwnerUserId: null,
    resource: "improve_presentation",
    model: ai.model,
    tokensIn: ai.tokensIn,
    tokensOut: ai.tokensOut,
    status: "ok",
  });

  return {
    ok: true,
    available: true,
    original,
    suggestions,
    notes,
    requiresConfirmation: true,
    usage: {
      used: usageGate.used + 1,
      limit: usageGate.limit,
      remaining: Math.max(0, usageGate.remaining - 1),
    },
    notice:
      "Sugestões geradas. Nenhuma alteração foi aplicada ao perfil — confirme manualmente qual texto deseja usar.",
  };
}
