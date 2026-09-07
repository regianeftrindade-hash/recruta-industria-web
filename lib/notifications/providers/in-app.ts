import { prisma } from "@/lib/db";
import type { NotificationProvider, ProviderSendResult } from "@/lib/notifications/types";

/** Notificações in-app — reutiliza a tabela Notification já existente no schema. */
export class InAppProvider implements NotificationProvider {
  readonly name = "in_app" as const;
  readonly channel = "IN_APP" as const;

  isEnabled(): boolean {
    return true;
  }

  async send(params: {
    to: string;
    userId: string;
    event: string;
    templateKey: string;
    bodyText: string;
    payload: { platformPath: string; eventLabel?: string };
  }): Promise<ProviderSendResult> {
    try {
      await prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.event,
          title: params.payload.eventLabel || params.templateKey,
          body: params.bodyText.slice(0, 500),
          href: params.payload.platformPath.split("?")[0],
          metadata: JSON.stringify({ templateKey: params.templateKey, channel: "IN_APP" }),
        },
      });
      return { ok: true, status: "sent", providerMessageId: null };
    } catch (error) {
      console.warn("[notifications/in-app]", error);
      return {
        ok: true,
        status: "simulated",
        simulated: true,
        errorMessage: "In-app simulado (tabela notifications indisponível).",
      };
    }
  }
}
