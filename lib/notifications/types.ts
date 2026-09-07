/**
 * Tipos da camada de notificações (independente da OpenAI).
 */

export type NotificationChannel = "IN_APP" | "EMAIL" | "WHATSAPP";

export type NotificationEvent =
  | "interview_invite"
  | "interview_confirmed"
  | "interview_rescheduled"
  | "interview_cancelled"
  | "interview_reminder"
  | "new_message"
  | "invite_accepted"
  | "invite_declined"
  | "process_stage_changed";

export type DeliveryStatus =
  | "queued"
  | "processing"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "skipped"
  | "simulated";

export type NotificationSkipReason =
  | "PROVIDER_DISABLED"
  | "NO_CONSENT"
  | "PHONE_UNVERIFIED"
  | "INVALID_NUMBER"
  | "USER_BLOCKED"
  | "TEMPLATE_NOT_APPROVED"
  | "RATE_LIMIT_OR_BILLING"
  | "TEMPORARY_FAILURE"
  | "CHANNEL_DISABLED_BY_USER"
  | "DUPLICATE"
  | "MISSING_RECIPIENT";

/** Payload seguro — sem CPF, RG, endereço, currículo, etc. */
export type SafeNotificationPayload = {
  companyName?: string;
  professionalName?: string;
  eventLabel: string;
  scheduledAtLabel?: string;
  /** Path autenticado na plataforma (ex.: /professional/dashboard) — sem dados privados na URL */
  platformPath: string;
  stageLabel?: string;
  locale?: "pt-BR";
};

export type NotificationJobInput = {
  userId: string;
  event: NotificationEvent;
  channels?: NotificationChannel[];
  payload: SafeNotificationPayload;
  /** Chave de idempotência (evita duplicata) */
  idempotencyKey: string;
  /** Metadados não sensíveis (IDs internos ok; sem PII) */
  metadata?: Record<string, string | number | boolean | null>;
};

export type ProviderSendResult = {
  ok: boolean;
  status: DeliveryStatus;
  providerMessageId?: string | null;
  errorCode?: NotificationSkipReason | string | null;
  errorMessage?: string | null;
  simulated?: boolean;
};

export type NotificationProviderName = "whatsapp" | "email" | "in_app" | "disabled";

export interface NotificationProvider {
  readonly name: NotificationProviderName;
  readonly channel: NotificationChannel;
  isEnabled(): boolean;
  send(params: {
    to: string;
    userId: string;
    event: NotificationEvent;
    templateKey: string;
    bodyText: string;
    payload: SafeNotificationPayload;
  }): Promise<ProviderSendResult>;
}
