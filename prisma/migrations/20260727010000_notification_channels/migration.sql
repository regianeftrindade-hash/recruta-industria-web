-- Preferências de notificação (WhatsApp: consentimento explícito)
CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
  "userId" TEXT NOT NULL,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
  "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
  "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
  "whatsappConsent" BOOLEAN NOT NULL DEFAULT false,
  "whatsappConsentAt" TIMESTAMP(3),
  "blocked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("userId")
);

-- Outbox / entregas
CREATE TABLE IF NOT EXISTS "notification_deliveries" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "templateKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "idempotencyKey" TEXT NOT NULL,
  "provider" TEXT,
  "providerMessageId" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "lastError" TEXT,
  "errorCode" TEXT,
  "payloadSummary" TEXT,
  "recipientHint" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attemptedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "readAt" TIMESTAMP(3),
  CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "notification_deliveries_idempotency_key"
  ON "notification_deliveries"("idempotencyKey");

CREATE INDEX IF NOT EXISTS "notification_deliveries_user_created_idx"
  ON "notification_deliveries"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "notification_deliveries_status_idx"
  ON "notification_deliveries"("status");
