-- Alinha ProfileMessage com schema.prisma (colunas já presentes em produção via DDL de runtime).
-- Idempotente: seguro em banco que já tem as colunas. Não apaga dados.

ALTER TABLE "ProfileMessage" ADD COLUMN IF NOT EXISTS "senderRole" TEXT NOT NULL DEFAULT 'COMPANY';
ALTER TABLE "ProfileMessage" ADD COLUMN IF NOT EXISTS "replyToId" TEXT;

CREATE INDEX IF NOT EXISTS "ProfileMessage_replyToId_idx" ON "ProfileMessage"("replyToId");
