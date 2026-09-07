/**
 * Helpers HTTP compartilhados das rotas /api/ai/*
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveAuthEmail } from "@/lib/api-auth";
import { aiErrorToJson, AiServiceError } from "@/lib/ai/errors";
import { loadUserByEmail, resolveAiActor, type AiActor } from "@/lib/ai/guard";
import { assertAiResourceAccess } from "@/lib/ai/guard";
import type { AiResource } from "@/lib/ai/resources";
import { parseStubCompanyBody } from "@/lib/ai/validate";

export async function requireAiActor(request: NextRequest): Promise<AiActor> {
  const auth = await resolveAuthEmail(request);
  if (!auth) {
    throw new AiServiceError("AI_UNAUTHORIZED", "Não autenticado.", 401);
  }
  const user = await loadUserByEmail(auth.email);
  if (!user) {
    throw new AiServiceError("AI_UNAUTHORIZED", "Usuário não encontrado.", 401);
  }
  return resolveAiActor({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
}

export function jsonAiError(error: unknown): NextResponse {
  const { status, body } = aiErrorToJson(error);
  // IA desligada: 200 + mensagem amigável (não quebra o client)
  if (
    error instanceof AiServiceError &&
    (error.code === "AI_DISABLED" || error.code === "AI_NOT_CONFIGURED")
  ) {
    return NextResponse.json(
      {
        ...body,
        available: false,
        reply: error.message,
        requiresConfirmation: true,
      },
      { status: 200 },
    );
  }
  return NextResponse.json(body, { status });
}

/** Stub Premium: valida auth/plano e responde “em breve”. */
export async function handlePremiumCompanyStub(
  request: NextRequest,
  resource: AiResource,
): Promise<NextResponse> {
  try {
    const actor = await requireAiActor(request);
    parseStubCompanyBody(await request.json().catch(() => ({})));
    // Força checagem de plano Premium antes do “não implementado”
    // assertAiResourceAccess falha em not implemented — então checamos plano manualmente via recurso
    // Marcamos implemented=false: assert retorna 501 após plano.
    await assertAiResourceAccess({ actor, resource });
    return NextResponse.json({ ok: false, error: "Não implementado" }, { status: 501 });
  } catch (error) {
    return jsonAiError(error);
  }
}
