import { NextRequest, NextResponse } from "next/server";
import { improveProfessionalPresentation } from "@/lib/ai/features/improve-presentation";
import { jsonAiError, requireAiActor } from "@/lib/ai/http";

/**
 * POST /api/ai/professional/improve-presentation
 * Body: { text?: string, instruction?: string }
 *
 * Retorna sugestões; NÃO grava no perfil (requiresConfirmation: true).
 * Plano/auth validados no servidor. Feature flag NEXT_PUBLIC_ENABLE_AI.
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await requireAiActor(request);
    const body = await request.json().catch(() => ({}));
    const result = await improveProfessionalPresentation(actor, body);
    return NextResponse.json(result);
  } catch (error) {
    return jsonAiError(error);
  }
}
