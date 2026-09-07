import {
  createAiResponse,
  type OpenAiResponseInputMessage,
} from "@/lib/openai";
import type { AiChatMessage } from "@/lib/ai/types";

export type OpenAiChatResult = {
  content: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
  /** false quando flag/chave ausente ou falha amigável */
  ok: boolean;
  errorCode?: string;
};

/**
 * Gera resposta via Responses API (SDK oficial em @/lib/openai).
 * Não lança quando a IA está desligada — retorna mensagem amigável.
 */
export async function chatCompletion(params: {
  system: string;
  messages: AiChatMessage[];
  temperature?: number;
}): Promise<OpenAiChatResult> {
  const input: OpenAiResponseInputMessage[] = params.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const result = await createAiResponse({
    instructions: params.system,
    input,
    temperature: params.temperature ?? 0.4,
  });

  if (!result.ok) {
    return {
      ok: false,
      content: result.content,
      tokensIn: 0,
      tokensOut: 0,
      model: "",
      errorCode: result.errorCode,
    };
  }

  return {
    ok: true,
    content: result.content,
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
    model: result.model,
  };
}
