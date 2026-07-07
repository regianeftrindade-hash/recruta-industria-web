const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Garantindo colunas Premium em Profile...');
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "planTier" TEXT NOT NULL DEFAULT 'FREE'`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMP(3)`,
  );

  const billingCols = [
    `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "billingPeriod" TEXT NOT NULL DEFAULT 'monthly'`,
    `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "billingMode" TEXT NOT NULL DEFAULT 'one_time'`,
    `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "autoRenew" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "gatewaySubscriptionId" TEXT`,
    `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "billingPeriod" TEXT NOT NULL DEFAULT 'monthly'`,
    `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "billingMode" TEXT NOT NULL DEFAULT 'one_time'`,
    `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "autoRenew" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "gatewaySubscriptionId" TEXT`,
  ];
  for (const sql of billingCols) {
    await prisma.$executeRawUnsafe(sql);
  }

  console.log('Garantindo tabela ProfileMessage...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProfileMessage" (
      "id" TEXT NOT NULL,
      "profileId" TEXT NOT NULL,
      "companyUserId" TEXT NOT NULL,
      "companyName" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ProfileMessage_pkey" PRIMARY KEY ("id")
    )
  `);

  const cols = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Profile'
      AND column_name IN ('planTier', 'subscriptionExpiresAt')
  `;
  console.log('Colunas Profile:', cols);
  console.log('Schema OK.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
