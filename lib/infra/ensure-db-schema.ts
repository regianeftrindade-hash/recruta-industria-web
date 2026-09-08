import { prisma } from "@/lib/db";

let coreSchemaReady = false;
let lastSeenReady = false;

/** Em produção, após `prisma migrate deploy`, use DISABLE_RUNTIME_DDL=true para cortar DDL no request path. */
export function isRuntimeDdlEnabled(): boolean {
  const flag = process.env.DISABLE_RUNTIME_DDL?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return false;
  return true;
}

/**
 * DDL do núcleo (propostas, funil, billing, vídeo).
 * Espelha prisma/migrations/20260907180000_unify_core_schema.
 * CREATE/ALTER são IF NOT EXISTS — seguro se o migrate já rodou.
 */
export async function applyCoreSchema(): Promise<void> {
  if (coreSchemaReady) return;
  if (!isRuntimeDdlEnabled()) {
    coreSchemaReady = true;
    return;
  }

  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "planTier" TEXT NOT NULL DEFAULT 'FREE'`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMP(3)`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "billingPeriod" TEXT NOT NULL DEFAULT 'monthly'`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "billingMode" TEXT NOT NULL DEFAULT 'one_time'`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "autoRenew" BOOLEAN NOT NULL DEFAULT false`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "gatewaySubscriptionId" TEXT`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "videoApresentacaoPath" TEXT`,
    );

    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "billingPeriod" TEXT NOT NULL DEFAULT 'monthly'`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "billingMode" TEXT NOT NULL DEFAULT 'one_time'`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "autoRenew" BOOLEAN NOT NULL DEFAULT false`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "gatewaySubscriptionId" TEXT`,
    );

    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CompanyProfileTracking" ADD COLUMN IF NOT EXISTS "emTeste" BOOLEAN NOT NULL DEFAULT false`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CompanyProfileTracking" ADD COLUMN IF NOT EXISTS "naoContratado" BOOLEAN NOT NULL DEFAULT false`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CompanyProfileTracking" ADD COLUMN IF NOT EXISTS "entrevistaCancelada" BOOLEAN NOT NULL DEFAULT false`,
    );

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProfileMessage" (
        "id" TEXT NOT NULL,
        "profileId" TEXT NOT NULL,
        "companyUserId" TEXT NOT NULL,
        "companyName" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "senderRole" TEXT NOT NULL DEFAULT 'COMPANY',
        "replyToId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProfileMessage_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "ProfileMessage" ADD COLUMN IF NOT EXISTS "senderRole" TEXT NOT NULL DEFAULT 'COMPANY'`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "ProfileMessage" ADD COLUMN IF NOT EXISTS "replyToId" TEXT`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ProfileMessage_profileId_idx" ON "ProfileMessage"("profileId")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ProfileMessage_companyUserId_idx" ON "ProfileMessage"("companyUserId")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ProfileMessage_createdAt_idx" ON "ProfileMessage"("createdAt")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ProfileMessage_replyToId_idx" ON "ProfileMessage"("replyToId")`,
    );

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "JobProposal" (
        "id" TEXT NOT NULL,
        "profileId" TEXT NOT NULL,
        "companyUserId" TEXT NOT NULL,
        "companyName" TEXT NOT NULL,
        "cargo" TEXT NOT NULL,
        "salario" TEXT NOT NULL,
        "turno" TEXT NOT NULL,
        "cidade" TEXT NOT NULL,
        "beneficios" TEXT NOT NULL,
        "mensagem" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'SENT',
        "respondedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "JobProposal_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "JobInterview" (
        "id" TEXT NOT NULL,
        "proposalId" TEXT NOT NULL,
        "scheduledAt" TIMESTAMP(3) NOT NULL,
        "locationType" TEXT NOT NULL,
        "address" TEXT,
        "meetingUrl" TEXT,
        "observacoes" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "JobInterview_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "JobInterview_proposalId_key" UNIQUE ("proposalId")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "JobProposalTracking" (
        "id" TEXT NOT NULL,
        "proposalId" TEXT NOT NULL,
        "contatado" BOOLEAN NOT NULL DEFAULT false,
        "entrevistado" BOOLEAN NOT NULL DEFAULT false,
        "emTeste" BOOLEAN NOT NULL DEFAULT false,
        "contratado" BOOLEAN NOT NULL DEFAULT false,
        "naoContratado" BOOLEAN NOT NULL DEFAULT false,
        "entrevistaCancelada" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "JobProposalTracking_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "JobProposalTracking_proposalId_key" UNIQUE ("proposalId")
      )
    `);

    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "JobProposal_profileId_idx" ON "JobProposal"("profileId")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "JobProposal_companyUserId_idx" ON "JobProposal"("companyUserId")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "JobProposal_status_idx" ON "JobProposal"("status")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "JobProposal_createdAt_idx" ON "JobProposal"("createdAt")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "JobInterview_status_idx" ON "JobInterview"("status")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "JobInterview_scheduledAt_idx" ON "JobInterview"("scheduledAt")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "JobProposalTracking_proposalId_idx" ON "JobProposalTracking"("proposalId")`,
    );

    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "JobProposalTracking" (
          id, "proposalId", contatado, entrevistado, "emTeste", contratado, "naoContratado", "entrevistaCancelada", "createdAt", "updatedAt"
        )
        SELECT
          ('fn-' || p.id),
          p.id,
          CASE WHEN p.status IN ('SENT', 'MORE_INFO', 'INTERESTED') THEN TRUE ELSE COALESCE(c.contatado, FALSE) END,
          CASE WHEN p.status IN ('SENT', 'MORE_INFO', 'INTERESTED') THEN FALSE ELSE COALESCE(c.entrevistado, FALSE) END,
          CASE WHEN p.status IN ('SENT', 'MORE_INFO', 'INTERESTED') THEN FALSE ELSE COALESCE(c."emTeste", FALSE) END,
          CASE WHEN p.status IN ('SENT', 'MORE_INFO', 'INTERESTED') THEN FALSE ELSE COALESCE(c.contratado, FALSE) END,
          CASE WHEN p.status IN ('SENT', 'MORE_INFO', 'INTERESTED') THEN FALSE ELSE COALESCE(c."naoContratado", FALSE) END,
          CASE
            WHEN p.status = 'INTERVIEW_CANCELLED' THEN TRUE
            WHEN p.status IN ('SENT', 'MORE_INFO', 'INTERESTED') THEN FALSE
            ELSE COALESCE(c."entrevistaCancelada", FALSE)
          END,
          NOW(),
          NOW()
        FROM "JobProposal" p
        LEFT JOIN "CompanyProfileTracking" c
          ON c."companyUserId" = p."companyUserId" AND c."profileId" = p."profileId"
        WHERE NOT EXISTS (
          SELECT 1 FROM "JobProposalTracking" t WHERE t."proposalId" = p.id
        )
      `);
    } catch (error) {
      console.warn("[schema] Backfill JobProposalTracking:", error);
    }

    coreSchemaReady = true;
  } catch (error) {
    console.error("[schema] Falha ao aplicar schema núcleo:", error);
    throw error;
  }
}

export async function ensurePaymentSchema(): Promise<void> {
  await applyCoreSchema();
}

export async function ensureProfilePremiumColumns(): Promise<void> {
  await applyCoreSchema();
}

export async function ensureProfileMessageTable(): Promise<void> {
  await applyCoreSchema();
}

export async function ensureJobProposalTables(): Promise<void> {
  await applyCoreSchema();
}

export async function ensureTrackingEmTesteColumn(): Promise<void> {
  await applyCoreSchema();
}

export async function ensureSubscriptionBillingColumns(): Promise<void> {
  await applyCoreSchema();
}

export async function ensureVideoApresentacaoColumn(): Promise<void> {
  await applyCoreSchema();
}

export async function ensureUserLastSeenColumn(): Promise<void> {
  if (lastSeenReady) return;
  if (!isRuntimeDdlEnabled()) {
    lastSeenReady = true;
    return;
  }
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3)`,
    );
  } catch (error) {
    console.warn("ensureUserLastSeenColumn:", error);
  }
  lastSeenReady = true;
}

let collaborationSchemaReady = false;

/**
 * Equipe, vídeo, banco de talentos e feedback da equipe.
 * Espelha prisma/migrations/20260907190000_collaboration_schema.
 */
export async function applyCollaborationSchema(): Promise<void> {
  if (collaborationSchemaReady) return;
  if (!isRuntimeDdlEnabled()) {
    collaborationSchemaReady = true;
    return;
  }
  try {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "extraSeats" INTEGER NOT NULL DEFAULT 0`,
  );
  await prisma.$executeRawUnsafe(`
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
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "CompanyTeamMember_owner_email_uidx" ON "CompanyTeamMember"("companyOwnerUserId", "invitedEmail")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "CompanyTeamMember_inviteToken_uidx" ON "CompanyTeamMember"("inviteToken")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CompanyTeamMember_memberUserId_idx" ON "CompanyTeamMember"("memberUserId")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CompanyTeamMember_owner_status_idx" ON "CompanyTeamMember"("companyOwnerUserId", "status")`,
  );

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyProfileFeedback" (
      "id" TEXT NOT NULL,
      "companyOwnerUserId" TEXT NOT NULL,
      "profileId" TEXT NOT NULL,
      "authorUserId" TEXT NOT NULL,
      "authorName" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompanyProfileFeedback_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CompanyProfileFeedback_owner_profile_idx" ON "CompanyProfileFeedback"("companyOwnerUserId", "profileId", "createdAt")`,
  );

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyTalentList" (
      id TEXT PRIMARY KEY,
      "companyUserId" TEXT NOT NULL,
      name TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyTalentListItem" (
      id TEXT PRIMARY KEY,
      "listId" TEXT NOT NULL,
      "profileId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("listId", "profileId")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyAlert" (
      id TEXT PRIMARY KEY,
      "companyUserId" TEXT NOT NULL,
      name TEXT NOT NULL,
      "filtersJSON" TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CompanyTalentList_companyUserId_idx" ON "CompanyTalentList"("companyUserId")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CompanyTalentListItem_listId_idx" ON "CompanyTalentListItem"("listId")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CompanyAlert_companyUserId_idx" ON "CompanyAlert"("companyUserId")`,
  );

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VideoCallInvite" (
      "id" TEXT NOT NULL,
      "profileId" TEXT NOT NULL,
      "companyUserId" TEXT NOT NULL,
      "companyName" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'RINGING',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VideoCallInvite_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "VideoCallInvite" ADD COLUMN IF NOT EXISTS "companyOwnerUserId" TEXT`,
  );
  await prisma.$executeRawUnsafe(`
    UPDATE "VideoCallInvite" SET "companyOwnerUserId" = "companyUserId" WHERE "companyOwnerUserId" IS NULL
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "VideoCallInvite_profileId_status_idx" ON "VideoCallInvite"("profileId", "status")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "VideoCallInvite_companyUserId_idx" ON "VideoCallInvite"("companyUserId")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "VideoCallInvite_owner_profile_status_idx" ON "VideoCallInvite"("companyOwnerUserId", "profileId", "status")`,
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VideoCallParticipant" (
      "id" TEXT NOT NULL,
      "callId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VideoCallParticipant_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "VideoCallParticipant" ADD COLUMN IF NOT EXISTS "userId" TEXT`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "VideoCallParticipant_callId_idx" ON "VideoCallParticipant"("callId")`,
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VideoCallTeamResponse" (
      "id" TEXT NOT NULL,
      "callId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "displayName" TEXT NOT NULL,
      "respondedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VideoCallTeamResponse_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "VideoCallTeamResponse_callId_userId_key" ON "VideoCallTeamResponse"("callId", "userId")`,
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VideoCallSignal" (
      "id" TEXT NOT NULL,
      "callId" TEXT NOT NULL,
      "fromUserId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "payload" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VideoCallSignal_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "VideoCallSignal_callId_createdAt_idx" ON "VideoCallSignal"("callId", "createdAt")`,
  );

    collaborationSchemaReady = true;
  } catch (error) {
    console.error("[schema] Falha ao aplicar schema de colaboração:", error);
    throw error;
  }
}
