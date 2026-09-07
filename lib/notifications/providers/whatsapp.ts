import type { NotificationProvider, ProviderSendResult } from "@/lib/notifications/types";
import { isWhatsAppEnabled, isWhatsAppFullyConfigured, getWhatsAppConfig } from "@/lib/notifications/config";

/**
 * Provedor WhatsApp Business Cloud API (oficial).
 * Com WHATSAPP_ENABLED=false: nunca chama a API — retorna simulated/skipped.
 */
export class WhatsAppProvider implements NotificationProvider {
  readonly name = "whatsapp" as const;
  readonly channel = "WHATSAPP" as const;

  isEnabled(): boolean {
    return isWhatsAppEnabled() && isWhatsAppFullyConfigured();
  }

  async send(params: {
    to: string;
    userId: string;
    event: string;
    templateKey: string;
    bodyText: string;
    payload: { platformPath: string };
  }): Promise<ProviderSendResult> {
    if (!isWhatsAppEnabled()) {
      return {
        ok: true,
        status: "simulated",
        simulated: true,
        errorCode: "PROVIDER_DISABLED",
        errorMessage: "WhatsApp desativado (WHATSAPP_ENABLED=false). Nenhum envio real.",
      };
    }

    const cfg = getWhatsAppConfig();
    if (!cfg.phoneNumberId || !cfg.accessToken) {
      return {
        ok: false,
        status: "skipped",
        errorCode: "PROVIDER_DISABLED",
        errorMessage: "Credenciais WhatsApp incompletas.",
      };
    }

    // Preparação da Cloud API — NÃO executar envio real nesta etapa do produto.
    // Quando for ativar, descomentar o fetch abaixo e remover o return simulated.
    void params;
    void cfg;
    return {
      ok: true,
      status: "simulated",
      simulated: true,
      errorCode: "PROVIDER_DISABLED",
      errorMessage:
        "Infraestrutura Cloud API pronta, mas envio real bloqueado nesta etapa (sem cobrança/ativação).",
    };

    /*
    const url = `https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: params.to,
        type: "text",
        text: { body: params.bodyText },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        status: "failed",
        errorCode: res.status === 429 ? "RATE_LIMIT_OR_BILLING" : "TEMPORARY_FAILURE",
        errorMessage: String((data as { error?: { message?: string } }).error?.message || res.status),
      };
    }
    const mid = (data as { messages?: Array<{ id?: string }> }).messages?.[0]?.id;
    return { ok: true, status: "sent", providerMessageId: mid || null };
    */
  }
}
