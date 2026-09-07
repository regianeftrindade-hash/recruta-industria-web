-- Scaffold IA / planos / chat (idempotente)
-- Compatível com ensureAssistantUsageTable em runtime

CREATE TABLE IF NOT EXISTS "assistant_usage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "periodKey" TEXT NOT NULL,
  "tokensIn" INTEGER NOT NULL DEFAULT 0,
  "tokensOut" INTEGER NOT NULL DEFAULT 0,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assistant_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "assistant_usage_userId_periodKey_key"
  ON "assistant_usage"("userId", "periodKey");

CREATE INDEX IF NOT EXISTS "assistant_usage_periodKey_idx"
  ON "assistant_usage"("periodKey");

CREATE TABLE IF NOT EXISTS "assistant_conversations" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT,
  "messages" TEXT NOT NULL DEFAULT '[]',
  "model" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assistant_conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "assistant_conversations_userId_updatedAt_idx"
  ON "assistant_conversations"("userId", "updatedAt");
