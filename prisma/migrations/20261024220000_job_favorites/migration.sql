-- Favoritos de vaga do profissional. Tabela nova: não altera vagas já gravadas.

CREATE TABLE IF NOT EXISTS "job_favorites" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "job_favorites_userId_jobId_key" ON "job_favorites"("userId", "jobId");
CREATE INDEX IF NOT EXISTS "job_favorites_userId_createdAt_idx" ON "job_favorites"("userId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "job_favorites"
    ADD CONSTRAINT "job_favorites_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "job_favorites"
    ADD CONSTRAINT "job_favorites_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
