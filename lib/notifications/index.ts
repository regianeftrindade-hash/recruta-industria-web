export type {
  NotificationChannel,
  NotificationEvent,
  DeliveryStatus,
  SafeNotificationPayload,
  NotificationJobInput,
  NotificationProvider,
  ProviderSendResult,
} from "@/lib/notifications/types";

export {
  isWhatsAppEnabled,
  isWhatsAppFullyConfigured,
  getWhatsAppConfig,
  NOTIFICATION_DEFAULT_CHANNELS,
} from "@/lib/notifications/config";

export {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  canSendWhatsApp,
  blockUserNotifications,
  ensureNotificationPreferenceTable,
} from "@/lib/notifications/preferences";

export { notify, notifyAsync } from "@/lib/notifications/service";
export { renderTemplate, listTemplateKeys, getTemplate } from "@/lib/notifications/templates/pt-BR";
export {
  verifyWhatsAppWebhookChallenge,
  verifyWhatsAppSignature,
  applyWhatsAppStatusWebhook,
} from "@/lib/notifications/webhook";
export {
  getNotificationAdminOverview,
  adminBlockUserNotifications,
  adminResendDelivery,
  adminSetChannelFlag,
  countUsersWithWhatsAppOptIn,
} from "@/lib/notifications/admin";
export { getProviderForChannel } from "@/lib/notifications/providers";
export { scrubNotificationText, normalizePhoneE164 } from "@/lib/notifications/sanitize";
