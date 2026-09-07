import { createHmac, timingSafeEqual } from "crypto";
import { getWhatsAppConfig } from "@/lib/notifications/config";
import {
  findDeliveryByProviderMessageId,
  updateDeliveryStatus,
} from "@/lib/notifications/queue";
import type { DeliveryStatus } from "@/lib/notifications/types";

/**
 * Verificação do webhook WhatsApp (hub.challenge).
 * GET: compare hub.verify_token com WHATSAPP_WEBHOOK_VERIFY_TOKEN.
 */
export function verifyWhatsAppWebhookChallenge(params: {
  mode?: string | null;
  token?: string | null;
  challenge?: string | null;
}): { ok: true; challenge: string } | { ok: false; reason: string } {
  const cfg = getWhatsAppConfig();
  if (params.mode !== "subscribe") {
    return { ok: false, reason: "mode inválido" };
  }
  if (!cfg.webhookVerifyToken) {
    return { ok: false, reason: "WHATSAPP_WEBHOOK_VERIFY_TOKEN não configurado" };
  }
  if (params.token !== cfg.webhookVerifyToken) {
    return { ok: false, reason: "token inválido" };
  }
  if (!params.challenge) {
    return { ok: false, reason: "challenge ausente" };
  }
  return { ok: true, challenge: params.challenge };
}

/**
 * Valida assinatura X-Hub-Signature-256 (App Secret).
 * Sem APP_SECRET configurado: rejeita em produção; em dev aceita com aviso se ENABLED=false.
 */
export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const cfg = getWhatsAppConfig();
  if (!cfg.appSecret) {
    // Sem secret: não confiar no payload para atualizar estados em produção
    return process.env.NODE_ENV !== "production" && !cfg.enabled;
  }
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", cfg.appSecret).update(rawBody).digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(received, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

type WaStatus = "sent" | "delivered" | "read" | "failed";

function mapWaStatus(status: string): DeliveryStatus | null {
  const s = status.toLowerCase();
  if (s === "sent") return "sent";
  if (s === "delivered") return "delivered";
  if (s === "read") return "read";
  if (s === "failed") return "failed";
  return null;
}

/**
 * Processa payload de status do webhook (estrutura Cloud API).
 * Não envia nada — só atualiza notification_deliveries quando houver providerMessageId.
 */
export async function applyWhatsAppStatusWebhook(body: unknown): Promise<{ updated: number }> {
  if (!body || typeof body !== "object") return { updated: 0 };
  const entries = (body as { entry?: unknown[] }).entry;
  if (!Array.isArray(entries)) return { updated: 0 };

  let updated = 0;
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const value = (change as { value?: { statuses?: Array<{ id?: string; status?: string }> } })
        ?.value;
      const statuses = value?.statuses;
      if (!Array.isArray(statuses)) continue;
      for (const st of statuses) {
        if (!st.id || !st.status) continue;
        const mapped = mapWaStatus(st.status as WaStatus);
        if (!mapped) continue;
        const row = await findDeliveryByProviderMessageId(st.id);
        if (!row) continue;
        await updateDeliveryStatus({
          id: row.id,
          status: mapped,
          providerMessageId: st.id,
        });
        updated += 1;
      }
    }
  }
  return { updated };
}
