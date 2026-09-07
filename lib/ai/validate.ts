/**
 * Validação de entradas das rotas de IA (sem Zod — padrão do projeto).
 */

import { AI_RESOURCE_META, type AiResource } from "@/lib/ai/resources";
import { AiServiceError } from "@/lib/ai/errors";
import { scrubPii } from "@/lib/ai/sanitize";

export type ImprovePresentationInput = {
  /** Rascunho atual (opcional — senão usa o do perfil no servidor) */
  text?: string;
  /** Instrução curta do usuário (opcional) */
  instruction?: string;
};

export function parseImprovePresentationBody(raw: unknown): {
  text: string | null;
  instruction: string | null;
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new AiServiceError("AI_VALIDATION", "Body JSON inválido.", 400);
  }
  const body = raw as Record<string, unknown>;

  let text: string | null = null;
  if (body.text != null) {
    if (typeof body.text !== "string") {
      throw new AiServiceError("AI_VALIDATION", "Campo text deve ser string.", 400);
    }
    const max = AI_RESOURCE_META.improve_presentation.maxInputChars;
    const scrubbed = scrubPii(body.text.trim()).text;
    if (scrubbed.length > max) {
      throw new AiServiceError(
        "AI_VALIDATION",
        `Texto excede o limite de ${max} caracteres.`,
        400,
      );
    }
    text = scrubbed;
  }

  let instruction: string | null = null;
  if (body.instruction != null) {
    if (typeof body.instruction !== "string") {
      throw new AiServiceError("AI_VALIDATION", "Campo instruction deve ser string.", 400);
    }
    instruction = scrubPii(body.instruction.trim()).text.slice(0, 300);
  }

  // Rejeita tentativas de enviar plano pelo client
  if ("planTier" in body || "companyPlanTier" in body || "plan" in body) {
    throw new AiServiceError(
      "AI_VALIDATION",
      "Não envie informações de plano pelo navegador. O plano é validado no servidor.",
      400,
    );
  }

  return { text, instruction };
}

export function assertMaxChars(resource: AiResource, text: string): string {
  const max = AI_RESOURCE_META[resource].maxInputChars;
  const scrubbed = scrubPii(text).text;
  if (scrubbed.length > max) {
    throw new AiServiceError(
      "AI_VALIDATION",
      `Texto excede o limite de ${max} caracteres.`,
      400,
    );
  }
  return scrubbed;
}

/** Stub: body mínimo para rotas futuras. */
export function parseStubCompanyBody(raw: unknown): Record<string, unknown> {
  if (raw != null && (typeof raw !== "object" || Array.isArray(raw))) {
    throw new AiServiceError("AI_VALIDATION", "Body JSON inválido.", 400);
  }
  const body = (raw || {}) as Record<string, unknown>;
  if ("planTier" in body || "companyPlanTier" in body || "plan" in body) {
    throw new AiServiceError(
      "AI_VALIDATION",
      "Não envie informações de plano pelo navegador.",
      400,
    );
  }
  return body;
}
