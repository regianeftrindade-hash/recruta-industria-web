-- Plano Premium profissional (R$ 19,90/mês)
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "planTier" TEXT NOT NULL DEFAULT 'FREE';
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMP(3);
