-- Modalidade única de candidatura. Vagas já existentes permanecem internas.

ALTER TABLE "job_postings"
  ADD COLUMN "applicationMode" TEXT NOT NULL DEFAULT 'INTERNAL',
  ADD COLUMN "externalApplyUrl" TEXT,
  ADD COLUMN "applicationEmail" TEXT;
