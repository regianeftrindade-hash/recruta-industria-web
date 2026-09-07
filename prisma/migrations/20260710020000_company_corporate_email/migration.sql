ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "emailCorporativo" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "emailCorporativoVerificado" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "CorporateEmailConfirmation" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CorporateEmailConfirmation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CorporateEmailConfirmation_token_key" ON "CorporateEmailConfirmation"("token");
CREATE INDEX IF NOT EXISTS "CorporateEmailConfirmation_email_idx" ON "CorporateEmailConfirmation"("email");
CREATE INDEX IF NOT EXISTS "CorporateEmailConfirmation_token_idx" ON "CorporateEmailConfirmation"("token");
