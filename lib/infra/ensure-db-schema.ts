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

    profileMessageTableReady = true;
  } catch (error) {
    console.error('[schema] Falha ao garantir tabela ProfileMessage:', error);
    throw error;
  }
}

export async function ensurePaymentSchema(): Promise<void> {
  await ensureProfilePremiumColumns();
  await ensureProfileMessageTable();
  await ensureSubscriptionBillingColumns();
  await ensureVideoApresentacaoColumn();
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
