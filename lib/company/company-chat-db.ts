import { prisma } from "@/lib/db";
import { isRuntimeDdlEnabled } from "@/lib/infra/ensure-db-schema";

let chatTableReady = false;

/** Garante a tabela de chat interno da equipe (respeita DISABLE_RUNTIME_DDL). */
export async function ensureCompanyChatMessageTable(): Promise<void> {
  if (chatTableReady) return;
  if (!isRuntimeDdlEnabled()) {
    chatTableReady = true;
    return;
  }
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyChatMessage" (
      "id" TEXT NOT NULL,
      "companyKey" TEXT NOT NULL,
      "authorUserId" TEXT NOT NULL,
      "authorName" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompanyChatMessage_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CompanyChatMessage_companyKey_createdAt_idx" ON "CompanyChatMessage"("companyKey", "createdAt")`,
  );
  chatTableReady = true;
}
