import { surfaceMessagesBaseA } from "@/lib/i18n/messages/surfaces-body-a";
import { surfaceMessagesBaseB } from "@/lib/i18n/messages/surfaces-body-b";

/** Base surface messages (pt-BR) without home commercial pitch keys. */
export const surfaceMessagesBase = {
  ...surfaceMessagesBaseA,
  ...surfaceMessagesBaseB,
} as const;
