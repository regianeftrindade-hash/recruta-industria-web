-- Número de WhatsApp para receber candidaturas. Não substitui e-mail nem candidatura interna.

ALTER TABLE "job_postings"
  ADD COLUMN IF NOT EXISTS "applicationPhone" TEXT;
