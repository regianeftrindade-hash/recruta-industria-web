-- Idempotente: fecha drift de billing/tracking + tabelas que só existiam via DDL em runtime.

-- Profile / Company billing espelhado
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "billingPeriod" TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "billingMode" TEXT NOT NULL DEFAULT 'one_time';
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "autoRenew" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "gatewaySubscriptionId" TEXT;

ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "billingPeriod" TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "billingMode" TEXT NOT NULL DEFAULT 'one_time';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "autoRenew" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "gatewaySubscriptionId" TEXT;

ALTER TABLE "CompanyProfileTracking" ADD COLUMN IF NOT EXISTS "entrevistaCancelada" BOOLEAN NOT NULL DEFAULT false;

-- Preferências da empresa
CREATE TABLE IF NOT EXISTS "CompanyPreference" (
  "companyUserId" TEXT NOT NULL,
  "anonymousMode" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompanyPreference_pkey" PRIMARY KEY ("companyUserId")
);

-- Avaliações de entrevista
CREATE TABLE IF NOT EXISTS "InterviewRating" (
  "id" TEXT NOT NULL,
  "callId" TEXT,
  "companyUserId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "reason" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InterviewRating_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "InterviewRating_companyUserId_idx" ON "InterviewRating"("companyUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "InterviewRating_callId_key" ON "InterviewRating"("callId");

-- Chat RH
CREATE TABLE IF NOT EXISTS "CompanyChatMessage" (
  "id" TEXT NOT NULL,
  "companyKey" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompanyChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CompanyChatMessage_companyKey_createdAt_idx"
  ON "CompanyChatMessage"("companyKey", "createdAt");

-- Telemetria IA
CREATE TABLE IF NOT EXISTS "ai_usage_events" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "companyOwnerUserId" TEXT,
  "resource" TEXT NOT NULL,
  "model" TEXT,
  "tokensIn" INTEGER NOT NULL DEFAULT 0,
  "tokensOut" INTEGER NOT NULL DEFAULT 0,
  "estimatedCostCents" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL,
  "errorCode" TEXT,
  "periodKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_usage_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ai_usage_events_userId_periodKey_idx"
  ON "ai_usage_events"("userId", "periodKey");
CREATE INDEX IF NOT EXISTS "ai_usage_events_resource_periodKey_idx"
  ON "ai_usage_events"("resource", "periodKey");
CREATE INDEX IF NOT EXISTS "ai_usage_events_company_periodKey_idx"
  ON "ai_usage_events"("companyOwnerUserId", "periodKey");

-- Auditoria (já no schema; migration explícita)
CREATE TABLE IF NOT EXISTS "SecurityAuditLog" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "ip" TEXT NOT NULL,
  "userAgent" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SecurityAuditLog_createdAt_idx" ON "SecurityAuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "SecurityAuditLog_action_idx" ON "SecurityAuditLog"("action");
CREATE INDEX IF NOT EXISTS "SecurityAuditLog_email_idx" ON "SecurityAuditLog"("email");

-- Share de perfil (já no schema; migration explícita)
CREATE TABLE IF NOT EXISTS "CompanyProfileShare" (
  "id" TEXT NOT NULL,
  "companyOwnerUserId" TEXT NOT NULL,
  "fromUserId" TEXT NOT NULL,
  "toUserId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  CONSTRAINT "CompanyProfileShare_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CompanyProfileShare_toUserId_createdAt_idx"
  ON "CompanyProfileShare"("toUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "CompanyProfileShare_companyOwnerUserId_profileId_idx"
  ON "CompanyProfileShare"("companyOwnerUserId", "profileId");
