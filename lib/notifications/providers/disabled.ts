import type { NotificationProvider, ProviderSendResult } from "@/lib/notifications/types";

/** Provedor desativado — nunca falha o sistema. */
export class DisabledProvider implements NotificationProvider {
  readonly name = "disabled" as const;
  readonly channel = "WHATSAPP" as const;

  isEnabled(): boolean {
    return false;
  }

  async send(): Promise<ProviderSendResult> {
    return {
      ok: true,
      status: "skipped",
      errorCode: "PROVIDER_DISABLED",
      errorMessage: "Provedor desativado.",
      simulated: true,
    };
  }
}
