-- Publicação de vagas e candidaturas. Não altera tabelas existentes.

CREATE TABLE "job_postings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT '',
    "confidential" BOOLEAN NOT NULL DEFAULT false,
    "publicationDate" DATE,
    "title" TEXT NOT NULL,
    "salaryCents" INTEGER,
    "salaryNegotiable" BOOLEAN NOT NULL DEFAULT false,
    "contractType" TEXT,
    "contractTypeOther" TEXT,
    "workMode" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "observations" TEXT,
    "applicationInstructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "origin" TEXT NOT NULL DEFAULT 'ADMIN',
    "companyUserId" TEXT,
    "createdByUserId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "job_postings_status_publicationDate_idx" ON "job_postings"("status", "publicationDate");
CREATE INDEX "job_postings_companyUserId_idx" ON "job_postings"("companyUserId");
CREATE INDEX "job_postings_createdByUserId_idx" ON "job_postings"("createdByUserId");
CREATE INDEX "job_applications_userId_idx" ON "job_applications"("userId");
CREATE INDEX "job_applications_jobId_createdAt_idx" ON "job_applications"("jobId", "createdAt");
CREATE UNIQUE INDEX "job_applications_jobId_userId_key" ON "job_applications"("jobId", "userId");

ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_companyUserId_fkey" FOREIGN KEY ("companyUserId") REFERENCES "Company"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
