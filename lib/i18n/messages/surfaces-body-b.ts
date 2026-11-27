import { surfaceMessagesBaseB1 } from "@/lib/i18n/messages/surfaces-body-b1";
import { surfaceMessagesBaseB2 } from "@/lib/i18n/messages/surfaces-body-b2";
import { surfaceMessagesBaseB3 } from "@/lib/i18n/messages/surfaces-body-b3";

/** Part of surface messages base (b). */
export const surfaceMessagesBaseB = {
  ...surfaceMessagesBaseB1,
  ...surfaceMessagesBaseB2,
  ...surfaceMessagesBaseB3,
} as const;
