-- Número de WhatsApp da vaga. Coluna nova e anulável: vagas já gravadas permanecem como estão.

ALTER TABLE "job_postings"
  ADD COLUMN IF NOT EXISTS "applicationWhatsapp" TEXT;
