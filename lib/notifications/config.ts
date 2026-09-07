/**
 * Configuração server-side — nunca NEXT_PUBLIC_ para tokens WhatsApp.
 */

function readFlag(raw: string | undefined): boolean {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export function isWhatsAppEnabled(): boolean {
  return readFlag(process.env.WHATSAPP_ENABLED);
}

export function getWhatsAppConfig() {
  return {
    enabled: isWhatsAppEnabled(),
    phoneNumberId: String(process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim(),
    businessAccountId: String(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "").trim(),
    accessToken: String(process.env.WHATSAPP_ACCESS_TOKEN || "").trim(),
    webhookVerifyToken: String(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "").trim(),
    /** Assinatura do webhook (App Secret) — futuro */
    appSecret: String(process.env.WHATSAPP_APP_SECRET || "").trim(),
    apiVersion: String(process.env.WHATSAPP_API_VERSION || "v21.0").trim() || "v21.0",
  };
}

export function isWhatsAppFullyConfigured(): boolean {
  const c = getWhatsAppConfig();
  return Boolean(
    c.enabled && c.phoneNumberId && c.accessToken && c.webhookVerifyToken,
  );
}

/** Limites de retry (apenas erros temporários). */
export const NOTIFICATION_RETRY = {
  maxAttempts: 5,
  temporaryErrorCodes: new Set([
    "TEMPORARY_FAILURE",
    "RATE_LIMIT_OR_BILLING",
    "ECONNRESET",
    "ETIMEDOUT",
    "503",
    "429",
  ]),
} as const;

export const NOTIFICATION_DEFAULT_CHANNELS = {
  interview_invite: ["IN_APP", "EMAIL", "WHATSAPP"] as const,
  interview_confirmed: ["IN_APP", "EMAIL", "WHATSAPP"] as const,
  interview_rescheduled: ["IN_APP", "EMAIL", "WHATSAPP"] as const,
  interview_cancelled: ["IN_APP", "EMAIL", "WHATSAPP"] as const,
  interview_reminder: ["IN_APP", "WHATSAPP"] as const,
  new_message: ["IN_APP", "EMAIL"] as const,
  invite_accepted: ["IN_APP", "EMAIL", "WHATSAPP"] as const,
  invite_declined: ["IN_APP", "EMAIL"] as const,
  process_stage_changed: ["IN_APP", "EMAIL"] as const,
};
