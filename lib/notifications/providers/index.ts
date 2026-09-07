import { WhatsAppProvider } from "@/lib/notifications/providers/whatsapp";
import { EmailProvider } from "@/lib/notifications/providers/email";
import { InAppProvider } from "@/lib/notifications/providers/in-app";
import { DisabledProvider } from "@/lib/notifications/providers/disabled";
import { isWhatsAppEnabled } from "@/lib/notifications/config";
import type { NotificationChannel, NotificationProvider } from "@/lib/notifications/types";

const whatsapp = new WhatsAppProvider();
const email = new EmailProvider();
const inApp = new InAppProvider();
const disabled = new DisabledProvider();

export function getProviderForChannel(channel: NotificationChannel): NotificationProvider {
  switch (channel) {
    case "WHATSAPP":
      return isWhatsAppEnabled() ? whatsapp : disabled;
    case "EMAIL":
      return email;
    case "IN_APP":
      return inApp;
    default:
      return disabled;
  }
}

export { whatsapp, email, inApp, disabled };
