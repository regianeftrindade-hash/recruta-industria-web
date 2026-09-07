import { prisma } from '@/lib/db';

let profilePremiumColumnsReady = false;

async function profileHasColumn(columnName: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Profile'
        AND lower(column_name) = lower(${columnName})
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

/** Garante colunas do plano Premium em Profile (PostgreSQL). */
export async function ensureProfilePremiumColumns(): Promise<void> {
  if (profilePremiumColumnsReady) return;

  try {
    const hasPlanTier = await profileHasColumn('planTier');
    if (!hasPlanTier) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Profile" ADD COLUMN "planTier" TEXT NOT NULL DEFAULT 'FREE'`,
      );
    }

    const hasExpiresAt = await profileHasColumn('subscriptionExpiresAt');
    if (!hasExpiresAt) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Profile" ADD COLUMN "subscriptionExpiresAt" TIMESTAMP(3)`,
      );
    }

    profilePremiumColumnsReady = true;
  } catch (error) {
    console.error('[schema] Falha ao garantir colunas Premium em Profile:', error);
    throw error;
  }
}

let profileMessageTableReady = false;

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

/** Garante tabela ProfileMessage (mensagens empresa → profissional). */
export async function ensureProfileMessageTable(): Promise<void> {
  if (profileMessageTableReady) return;

  try {
    const exists = await tableExists('ProfileMessage');
    if (!exists) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "ProfileMessage" (
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
    }

    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ProfileMessage_profileId_idx" ON "ProfileMessage"("profileId")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ProfileMessage_companyUserId_idx" ON "ProfileMessage"("companyUserId")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ProfileMessage_createdAt_idx" ON "ProfileMessage"("createdAt")`,
    );

    // Colunas para resposta profissional ↔ empresa
    const hasSenderRole = await profileMessageHasColumn('senderRole');
    if (!hasSenderRole) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "ProfileMessage" ADD COLUMN "senderRole" TEXT NOT NULL DEFAULT 'COMPANY'`,
      );
    }
    const hasReplyToId = await profileMessageHasColumn('replyToId');
    if (!hasReplyToId) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "ProfileMessage" ADD COLUMN "replyToId" TEXT`,
      );
    }
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ProfileMessage_replyToId_idx" ON "ProfileMessage"("replyToId")`,
    );

    profileMessageTableReady = true;
  } catch (error) {
    console.error('[schema] Falha ao garantir tabela ProfileMessage:', error);
    throw error;
  }
}

async function profileMessageHasColumn(columnName: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ProfileMessage'
        AND lower(column_name) = lower(${columnName})
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

export async function ensurePaymentSchema(): Promise<void> {
  await ensureProfilePremiumColumns();
  await ensureProfileMessageTable();
  await ensureJobProposalTables();
  await ensureSubscriptionBillingColumns();
  await ensureVideoApresentacaoColumn();
  await ensureTrackingEmTesteColumn();
}

let trackingEmTesteReady = false;

/** Coluna emTeste / naoContratado no acompanhamento empresa → profissional. */
export async function ensureTrackingEmTesteColumn(): Promise<void> {
  if (trackingEmTesteReady) return;
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CompanyProfileTracking" ADD COLUMN IF NOT EXISTS "emTeste" BOOLEAN NOT NULL DEFAULT false`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CompanyProfileTracking" ADD COLUMN IF NOT EXISTS "naoContratado" BOOLEAN NOT NULL DEFAULT false`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CompanyProfileTracking" ADD COLUMN IF NOT EXISTS "entrevistaCancelada" BOOLEAN NOT NULL DEFAULT false`,
    );
  } catch (error) {
    console.warn("ensureTrackingEmTesteColumn:", error);
  }
  trackingEmTesteReady = true;
}

let jobProposalTablesReady = false;

/** Tabelas JobProposal e JobInterview (proposta → entrevista). */
export async function ensureJobProposalTables(): Promise<void> {
  if (jobProposalTablesReady) return;

  try {
    const hasProposal = await tableExists('JobProposal');
    if (!hasProposal) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "JobProposal" (
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
    }

    const hasInterview = await tableExists('JobInterview');
    if (!hasInterview) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "JobInterview" (
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
    }

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

    jobProposalTablesReady = true;
  } catch (error) {
    console.error('[schema] Falha ao garantir tabelas JobProposal/JobInterview:', error);
    throw error;
  }
}

let subscriptionBillingColumnsReady = false;

async function companyHasColumn(columnName: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Company'
        AND column_name = ${columnName}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

/** Colunas de assinatura recorrente em Company e Profile. */
export async function ensureSubscriptionBillingColumns(): Promise<void> {
  if (subscriptionBillingColumnsReady) return;

  const columns: Array<{ table: string; name: string; sql: string }> = [
    { table: 'Company', name: 'billingPeriod', sql: `ALTER TABLE "Company" ADD COLUMN "billingPeriod" TEXT NOT NULL DEFAULT 'monthly'` },
    { table: 'Company', name: 'billingMode', sql: `ALTER TABLE "Company" ADD COLUMN "billingMode" TEXT NOT NULL DEFAULT 'one_time'` },
    { table: 'Company', name: 'autoRenew', sql: `ALTER TABLE "Company" ADD COLUMN "autoRenew" BOOLEAN NOT NULL DEFAULT false` },
    { table: 'Company', name: 'gatewaySubscriptionId', sql: `ALTER TABLE "Company" ADD COLUMN "gatewaySubscriptionId" TEXT` },
    { table: 'Profile', name: 'billingPeriod', sql: `ALTER TABLE "Profile" ADD COLUMN "billingPeriod" TEXT NOT NULL DEFAULT 'monthly'` },
    { table: 'Profile', name: 'billingMode', sql: `ALTER TABLE "Profile" ADD COLUMN "billingMode" TEXT NOT NULL DEFAULT 'one_time'` },
    { table: 'Profile', name: 'autoRenew', sql: `ALTER TABLE "Profile" ADD COLUMN "autoRenew" BOOLEAN NOT NULL DEFAULT false` },
    { table: 'Profile', name: 'gatewaySubscriptionId', sql: `ALTER TABLE "Profile" ADD COLUMN "gatewaySubscriptionId" TEXT` },
  ];

  for (const col of columns) {
    const hasColumn = col.table === 'Company'
      ? await companyHasColumn(col.name)
      : await profileHasColumn(col.name);
    if (!hasColumn) {
      await prisma.$executeRawUnsafe(col.sql);
    }
  }

  subscriptionBillingColumnsReady = true;
}

let videoApresentacaoColumnReady = false;

/** Coluna de vídeo de apresentação em Profile. */
export async function ensureVideoApresentacaoColumn(): Promise<void> {
  if (videoApresentacaoColumnReady) return;

  const hasColumn = await profileHasColumn('videoApresentacaoPath');
  if (!hasColumn) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "videoApresentacaoPath" TEXT`,
    );
  }

  videoApresentacaoColumnReady = true;
}
