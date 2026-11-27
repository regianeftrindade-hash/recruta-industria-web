import { homePitchMessagesPt } from "@/lib/i18n/messages/home-pitch.pt";
import { surfaceMessagesBase } from "@/lib/i18n/messages/surfaces-body";

/** Textos das telas que ainda estavam fora do catálogo. O português é o da interface atual. */
export const surfaceMessages = {
  ...homePitchMessagesPt,
  ...surfaceMessagesBase,
} as const;
