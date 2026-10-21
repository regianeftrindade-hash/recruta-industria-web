ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "emailStatus" TEXT;
ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "emailAttemptAt" TIMESTAMP(3);
