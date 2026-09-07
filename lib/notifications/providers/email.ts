import type { NotificationProvider, ProviderSendResult } from "@/lib/notifications/types";

/**
 * Provedor de e-mail da camada genérica.
 * Nesta etapa: simulado — os e-mails reais de entrevista continuam em
 * lib/professional/professional-notifications.ts (fluxo atual intacto).
 */
export class EmailProvider implements NotificationProvider {
  readonly name = "email" as const;
  readonly channel = "EMAIL" as const;

  isEnabled(): boolean {
    return true;
  }

  async send(params: {
    to: string;
    userId: string;
    event: string;
    templateKey: string;
    bodyText: string;
  }): Promise<ProviderSendResult> {
    void params;
    return {
      ok: true,
      status: "simulated",
      simulated: true,
      errorMessage:
        "EmailProvider em modo preparado — envios de entrevista atuais usam o fluxo de e-mail existente.",
    };
  }
}
