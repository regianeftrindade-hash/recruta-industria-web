-- Mensagens empresa → profissional (caixa de entrada do candidato)
CREATE TABLE IF NOT EXISTS "ProfileMessage" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "companyUserId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProfileMessage_profileId_idx" ON "ProfileMessage"("profileId");
CREATE INDEX IF NOT EXISTS "ProfileMessage_companyUserId_idx" ON "ProfileMessage"("companyUserId");
CREATE INDEX IF NOT EXISTS "ProfileMessage_createdAt_idx" ON "ProfileMessage"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProfileMessage_profileId_fkey'
  ) THEN
    ALTER TABLE "ProfileMessage"
      ADD CONSTRAINT "ProfileMessage_profileId_fkey"
      FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
