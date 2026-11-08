ALTER TABLE "job_postings" ADD COLUMN IF NOT EXISTS "manualApplication" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "job_postings" ADD COLUMN IF NOT EXISTS "manualCareOf" TEXT;
ALTER TABLE "job_postings" ADD COLUMN IF NOT EXISTS "manualSubject" TEXT;

UPDATE "job_postings"
SET "manualApplication" = true
WHERE "id" = 'cmluxprod20261102manual1';
