import { NextRequest, NextResponse } from "next/server";
import {
  verifyWhatsAppWebhookChallenge,
  verifyWhatsAppSignature,
  applyWhatsAppStatusWebhook,
  isWhatsAppEnabled,
} from "@/lib/notifications";

/**
 * GET — verificação do webhook (Meta hub.challenge).
 * Não envia mensagens.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const result = verifyWhatsAppWebhookChallenge({
    mode: sp.get("hub.mode"),
    token: sp.get("hub.verify_token"),
    challenge: sp.get("hub.challenge"),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 403 });
  }
  return new NextResponse(result.challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * POST — recebe status (enviado/entregue/lido/falhou).
 * Valida assinatura quando WHATSAPP_APP_SECRET estiver definido.
 * Com WHATSAPP_ENABLED=false ainda aceita em dev para testes de parsing.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (isWhatsAppEnabled() || process.env.NODE_ENV === "production") {
    if (!verifyWhatsAppSignature(raw, signature)) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }
  }

  let body: unknown = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { updated } = await applyWhatsAppStatusWebhook(body);
  return NextResponse.json({ ok: true, updated, simulated: !isWhatsAppEnabled() });
}
