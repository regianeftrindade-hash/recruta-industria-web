-- Equipe RH, videochamada, banco de talentos e feedback — IF NOT EXISTS (produção já pode ter via ensure).

ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "extraSeats" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "CompanyTeamMember" (
  "id" TEXT NOT NULL,
  "companyOwnerUserId" TEXT NOT NULL,
  "memberUserId" TEXT,
  "invitedEmail" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'RH',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "inviteToken" TEXT,
  "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompanyTeamMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyTeamMember_owner_email_uidx" ON "CompanyTeamMember"("companyOwnerUserId", "invitedEmail");
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyTeamMember_inviteToken_uidx" ON "CompanyTeamMember"("inviteToken");
CREATE INDEX IF NOT EXISTS "CompanyTeamMember_memberUserId_idx" ON "CompanyTeamMember"("memberUserId");
CREATE INDEX IF NOT EXISTS "CompanyTeamMember_owner_status_idx" ON "CompanyTeamMember"("companyOwnerUserId", "status");

CREATE TABLE IF NOT EXISTS "CompanyProfileFeedback" (
  "id" TEXT NOT NULL,
  "companyOwnerUserId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompanyProfileFeedback_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CompanyProfileFeedback_owner_profile_idx" ON "CompanyProfileFeedback"("companyOwnerUserId", "profileId", "createdAt");

CREATE TABLE IF NOT EXISTS "CompanyTalentList" (
  id TEXT PRIMARY KEY,
  "companyUserId" TEXT NOT NULL,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "CompanyTalentListItem" (
  id TEXT PRIMARY KEY,
  "listId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("listId", "profileId")
);
CREATE TABLE IF NOT EXISTS "CompanyAlert" (
  id TEXT PRIMARY KEY,
  "companyUserId" TEXT NOT NULL,
  name TEXT NOT NULL,
  "filtersJSON" TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "CompanyTalentList_companyUserId_idx" ON "CompanyTalentList"("companyUserId");
CREATE INDEX IF NOT EXISTS "CompanyTalentListItem_listId_idx" ON "CompanyTalentListItem"("listId");
CREATE INDEX IF NOT EXISTS "CompanyAlert_companyUserId_idx" ON "CompanyAlert"("companyUserId");

CREATE TABLE IF NOT EXISTS "VideoCallInvite" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "companyUserId" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RINGING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VideoCallInvite_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "VideoCallInvite" ADD COLUMN IF NOT EXISTS "companyOwnerUserId" TEXT;
UPDATE "VideoCallInvite" SET "companyOwnerUserId" = "companyUserId" WHERE "companyOwnerUserId" IS NULL;
CREATE INDEX IF NOT EXISTS "VideoCallInvite_profileId_status_idx" ON "VideoCallInvite"("profileId", "status");
CREATE INDEX IF NOT EXISTS "VideoCallInvite_companyUserId_idx" ON "VideoCallInvite"("companyUserId");
CREATE INDEX IF NOT EXISTS "VideoCallInvite_owner_profile_status_idx" ON "VideoCallInvite"("companyOwnerUserId", "profileId", "status");

CREATE TABLE IF NOT EXISTS "VideoCallParticipant" (
  "id" TEXT NOT NULL,
  "callId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VideoCallParticipant_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "VideoCallParticipant" ADD COLUMN IF NOT EXISTS "userId" TEXT;
CREATE INDEX IF NOT EXISTS "VideoCallParticipant_callId_idx" ON "VideoCallParticipant"("callId");

CREATE TABLE IF NOT EXISTS "VideoCallTeamResponse" (
  "id" TEXT NOT NULL,
  "callId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "displayName" TEXT NOT NULL,
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VideoCallTeamResponse_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "VideoCallTeamResponse_callId_userId_key" ON "VideoCallTeamResponse"("callId", "userId");

CREATE TABLE IF NOT EXISTS "VideoCallSignal" (
  "id" TEXT NOT NULL,
  "callId" TEXT NOT NULL,
  "fromUserId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VideoCallSignal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "VideoCallSignal_callId_createdAt_idx" ON "VideoCallSignal"("callId", "createdAt");
