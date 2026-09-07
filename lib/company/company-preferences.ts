import { prisma } from "@/lib/db";

let prefTableReady = false;

export async function ensureCompanyPreferenceTable(): Promise<void> {
  if (prefTableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyPreference" (
      "companyUserId" TEXT NOT NULL,
      "anonymousMode" BOOLEAN NOT NULL DEFAULT false,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompanyPreference_pkey" PRIMARY KEY ("companyUserId")
    )
  `);
  prefTableReady = true;
}

export async function getCompanyAnonymousMode(companyUserId: string): Promise<boolean> {
  await ensureCompanyPreferenceTable();
  const rows = await prisma.$queryRaw<Array<{ anonymousMode: boolean }>>`
    SELECT "anonymousMode" FROM "CompanyPreference"
    WHERE "companyUserId" = ${companyUserId}
    LIMIT 1
  `;
  return rows[0]?.anonymousMode === true;
}

export async function setCompanyAnonymousMode(companyUserId: string, value: boolean): Promise<void> {
  await ensureCompanyPreferenceTable();
  await prisma.$executeRaw`
    INSERT INTO "CompanyPreference" ("companyUserId", "anonymousMode", "updatedAt")
    VALUES (${companyUserId}, ${value}, NOW())
    ON CONFLICT ("companyUserId")
    DO UPDATE SET "anonymousMode" = ${value}, "updatedAt" = NOW()
  `;
}
