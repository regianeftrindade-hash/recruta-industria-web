-- Idempotente: produção já pode ter essas tabelas/colunas via ensure em runtime.
-- Alinha o histórico Prisma com o schema.prisma (propostas, funil, billing, presença).

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);

ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "planTier" TEXT NOT NULL DEFAULT 'FREE';
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMP(3);
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "billingPeriod" TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "billingMode" TEXT NOT NULL DEFAULT 'one_time';
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "autoRenew" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "gatewaySubscriptionId" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "videoApresentacaoPath" TEXT;

ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "billingPeriod" TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "billingMode" TEXT NOT NULL DEFAULT 'one_time';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "autoRenew" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "gatewaySubscriptionId" TEXT;

ALTER TABLE "CompanyProfileTracking" ADD COLUMN IF NOT EXISTS "emTeste" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CompanyProfileTracking" ADD COLUMN IF NOT EXISTS "naoContratado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CompanyProfileTracking" ADD COLUMN IF NOT EXISTS "entrevistaCancelada" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "JobProposal" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "companyUserId" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "cargo" TEXT NOT NULL,
  "salario" TEXT NOT NULL,
  "turno" TEXT NOT NULL,
  "cidade" TEXT NOT NULL,
  "beneficios" TEXT NOT NULL,
  "mensagem" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobProposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "JobInterview" (
  "id" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "locationType" TEXT NOT NULL,
  "address" TEXT,
  "meetingUrl" TEXT,
  "observacoes" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobInterview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "JobInterview_proposalId_key" UNIQUE ("proposalId")
);

CREATE TABLE IF NOT EXISTS "JobProposalTracking" (
  "id" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "contatado" BOOLEAN NOT NULL DEFAULT false,
  "entrevistado" BOOLEAN NOT NULL DEFAULT false,
  "emTeste" BOOLEAN NOT NULL DEFAULT false,
  "contratado" BOOLEAN NOT NULL DEFAULT false,
  "naoContratado" BOOLEAN NOT NULL DEFAULT false,
  "entrevistaCancelada" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobProposalTracking_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "JobProposalTracking_proposalId_key" UNIQUE ("proposalId")
);

CREATE INDEX IF NOT EXISTS "JobProposal_profileId_idx" ON "JobProposal"("profileId");
CREATE INDEX IF NOT EXISTS "JobProposal_companyUserId_idx" ON "JobProposal"("companyUserId");
CREATE INDEX IF NOT EXISTS "JobProposal_status_idx" ON "JobProposal"("status");
CREATE INDEX IF NOT EXISTS "JobProposal_createdAt_idx" ON "JobProposal"("createdAt");
CREATE INDEX IF NOT EXISTS "JobInterview_status_idx" ON "JobInterview"("status");
CREATE INDEX IF NOT EXISTS "JobInterview_scheduledAt_idx" ON "JobInterview"("scheduledAt");
CREATE INDEX IF NOT EXISTS "JobProposalTracking_proposalId_idx" ON "JobProposalTracking"("proposalId");

INSERT INTO "JobProposalTracking" (
  id, "proposalId", contatado, entrevistado, "emTeste", contratado, "naoContratado", "entrevistaCancelada", "createdAt", "updatedAt"
)
SELECT
  ('fn-' || p.id),
  p.id,
  CASE WHEN p.status IN ('SENT', 'MORE_INFO', 'INTERESTED') THEN TRUE ELSE COALESCE(c.contatado, FALSE) END,
  CASE WHEN p.status IN ('SENT', 'MORE_INFO', 'INTERESTED') THEN FALSE ELSE COALESCE(c.entrevistado, FALSE) END,
  CASE WHEN p.status IN ('SENT', 'MORE_INFO', 'INTERESTED') THEN FALSE ELSE COALESCE(c."emTeste", FALSE) END,
  CASE WHEN p.status IN ('SENT', 'MORE_INFO', 'INTERESTED') THEN FALSE ELSE COALESCE(c.contratado, FALSE) END,
  CASE WHEN p.status IN ('SENT', 'MORE_INFO', 'INTERESTED') THEN FALSE ELSE COALESCE(c."naoContratado", FALSE) END,
  CASE
    WHEN p.status = 'INTERVIEW_CANCELLED' THEN TRUE
    WHEN p.status IN ('SENT', 'MORE_INFO', 'INTERESTED') THEN FALSE
    ELSE COALESCE(c."entrevistaCancelada", FALSE)
  END,
  NOW(),
  NOW()
FROM "JobProposal" p
LEFT JOIN "CompanyProfileTracking" c
  ON c."companyUserId" = p."companyUserId" AND c."profileId" = p."profileId"
WHERE NOT EXISTS (
  SELECT 1 FROM "JobProposalTracking" t WHERE t."proposalId" = p.id
);
