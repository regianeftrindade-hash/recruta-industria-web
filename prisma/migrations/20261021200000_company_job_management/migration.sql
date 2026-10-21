-- Local da vaga e etapa da candidatura. Não apaga candidaturas nem perfis.

ALTER TABLE "job_postings" ADD COLUMN "workplace" TEXT;

ALTER TABLE "job_applications" ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'NEW';
