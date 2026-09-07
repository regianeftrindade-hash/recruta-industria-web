/**
 * Erros tipados da camada de IA — respostas amigáveis na API.
 */

export type AiErrorCode =
  | "AI_DISABLED"
  | "AI_NOT_CONFIGURED"
  | "AI_UNAUTHORIZED"
  | "AI_FORBIDDEN_ROLE"
  | "AI_FORBIDDEN_PLAN"
  | "AI_FORBIDDEN_RESOURCE"
  | "AI_NOT_IMPLEMENTED"
  | "AI_MONTHLY_LIMIT"
  | "AI_RATE_LIMIT"
  | "AI_VALIDATION"
  | "AI_API_ERROR"
  | "AI_UNAVAILABLE";

export class AiServiceError extends Error {
  readonly code: AiErrorCode;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AiErrorCode,
    message: string,
    httpStatus = 400,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AiServiceError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export function aiErrorToJson(error: unknown): {
  status: number;
  body: { ok: false; error: string; code: string; details?: Record<string, unknown> };
} {
  if (error instanceof AiServiceError) {
    return {
      status: error.httpStatus,
      body: {
        ok: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
    };
  }
  console.error("[ai]", error);
  return {
    status: 500,
    body: {
      ok: false,
      error: "Não foi possível processar a solicitação de IA agora.",
      code: "AI_API_ERROR",
    },
  };
}
