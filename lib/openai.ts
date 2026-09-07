/**
 * Cliente OpenAI — apenas servidor.
 * Não importe este módulo em componentes "use client".
 *
 * Caminho do projeto: lib/openai.ts (não há pasta src/; alias @/* → raiz).
 */

import OpenAI from "openai";

if (typeof window !== "undefined") {
  throw new Error(
    "[openai] Este módulo é exclusivo do servidor e não pode ser importado no client.",
  );
}

/** Mensagens amigáveis quando a IA ainda não está disponível. */
export const AI_UNAVAILABLE_MESSAGES = {
  featureOff:
    "A assistente de IA ainda não está ativa neste ambiente. Em breve ela estará disponível no Recruta Indústria.",
  missingKey:
    "A assistente de IA ainda não foi configurada. Peça ao administrador para definir a chave OPENAI_API_KEY.",
  notReady:
    "A assistente de IA ainda não está disponível. Tente novamente mais tarde.",
} as const;

export type AiReadiness = {
  /** Feature flag NEXT_PUBLIC_ENABLE_AI */
  featureEnabled: boolean;
  /** OPENAI_API_KEY presente (somente servidor) */
  apiKeyConfigured: boolean;
  /** Flag ligada + chave presente */
  ready: boolean;
  /** Motivo amigável quando não está pronta */
  message: string | null;
};

function readFlag(raw: string | undefined): boolean {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** Lê OPENAI_API_KEY apenas no servidor — nunca exponha no client. */
export function getOpenAiApiKey(): string {
  return String(process.env.OPENAI_API_KEY || "").trim();
}

/** Modelo via OPENAI_MODEL (padrão seguro para preparação). */
export function getOpenAiModel(): string {
  return String(process.env.OPENAI_MODEL || "gpt-4o-mini").trim() || "gpt-4o-mini";
}

/** Feature flag pública (só indica se a UI pode oferecer IA). */
export function isAiFeatureEnabled(): boolean {
  return readFlag(process.env.NEXT_PUBLIC_ENABLE_AI || process.env.ENABLE_AI);
}

/** Verifica se a chave da OpenAI está configurada no servidor. */
export function isOpenAiConfigured(): boolean {
  return getOpenAiApiKey().length > 0;
}

/**
 * IA pronta para uso real: flag ligada + chave presente.
 * Não ativa cobrança nem planos — só readiness técnico.
 */
export function isAiConfigured(): boolean {
  return isAiFeatureEnabled() && isOpenAiConfigured();
}

export function getAiReadiness(): AiReadiness {
  const featureEnabled = isAiFeatureEnabled();
  const apiKeyConfigured = isOpenAiConfigured();
  const ready = featureEnabled && apiKeyConfigured;

  let message: string | null = null;
  if (!featureEnabled) message = AI_UNAVAILABLE_MESSAGES.featureOff;
  else if (!apiKeyConfigured) message = AI_UNAVAILABLE_MESSAGES.missingKey;

  return { featureEnabled, apiKeyConfigured, ready, message };
}

/** Mensagem amigável (nunca lança) quando a IA não está pronta. */
export function getAiUnavailableMessage(): string {
  return getAiReadiness().message || AI_UNAVAILABLE_MESSAGES.notReady;
}

let clientSingleton: OpenAI | null = null;

/**
 * Instância do SDK oficial. Retorna null se a chave não existir
 * (não lança — chamador decide mensagem amigável).
 */
export function getOpenAiClient(): OpenAI | null {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) return null;
  if (!clientSingleton) {
    clientSingleton = new OpenAI({ apiKey });
  }
  return clientSingleton;
}

export type OpenAiResponseInputMessage = {
  role: "user" | "assistant" | "system" | "developer";
  content: string;
};

export type CreateAiResponseParams = {
  /** Instruções de sistema (persona / regras) */
  instructions?: string;
  /** Histórico + mensagem atual (Responses API) */
  input: string | OpenAiResponseInputMessage[];
  temperature?: number;
  model?: string;
};

export type CreateAiResponseResult =
  | {
      ok: true;
      content: string;
      tokensIn: number;
      tokensOut: number;
      model: string;
      responseId: string;
    }
  | {
      ok: false;
      content: string;
      errorCode: "AI_NOT_READY" | "OPENAI_EMPTY_REPLY" | "OPENAI_ERROR";
    };

/**
 * Chama a Responses API da OpenAI.
 * Se a IA estiver desligada ou sem chave, retorna mensagem amigável (ok: false).
 */
export async function createAiResponse(
  params: CreateAiResponseParams,
): Promise<CreateAiResponseResult> {
  const readiness = getAiReadiness();
  if (!readiness.ready) {
    return {
      ok: false,
      content: readiness.message || AI_UNAVAILABLE_MESSAGES.notReady,
      errorCode: "AI_NOT_READY",
    };
  }

  const client = getOpenAiClient();
  if (!client) {
    return {
      ok: false,
      content: AI_UNAVAILABLE_MESSAGES.missingKey,
      errorCode: "AI_NOT_READY",
    };
  }

  const model = params.model || getOpenAiModel();

  try {
    const response = await client.responses.create({
      model,
      instructions: params.instructions || undefined,
      input: params.input,
      temperature: params.temperature ?? 0.4,
    });

    const content = String(response.output_text || "").trim();
    if (!content) {
      return {
        ok: false,
        content: "A assistente não retornou texto. Tente reformular a pergunta.",
        errorCode: "OPENAI_EMPTY_REPLY",
      };
    }

    return {
      ok: true,
      content,
      tokensIn: Number(response.usage?.input_tokens || 0),
      tokensOut: Number(response.usage?.output_tokens || 0),
      model: String(response.model || model),
      responseId: response.id,
    };
  } catch (error) {
    console.error("[openai] responses.create:", error);
    return {
      ok: false,
      content: "Não foi possível falar com a assistente agora. Tente novamente em instantes.",
      errorCode: "OPENAI_ERROR",
    };
  }
}
