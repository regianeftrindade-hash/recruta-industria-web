import { prisma } from "@/lib/db";

/** Considera online se o heartbeat chegou nos últimos 2 minutos. */
export const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

let lastSeenColumnReady = false;

export async function ensureLastSeenColumn(): Promise<void> {
  if (lastSeenColumnReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3)
    `);
    lastSeenColumnReady = true;
  } catch (error) {
    console.error("[presence] Falha ao garantir coluna lastSeenAt:", error);
    throw error;
  }
}

export function isOnlineFromLastSeen(lastSeenAt: Date | string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  const t = typeof lastSeenAt === "string" ? new Date(lastSeenAt) : lastSeenAt;
  if (Number.isNaN(t.getTime())) return false;
  return Date.now() - t.getTime() <= ONLINE_THRESHOLD_MS;
}

export async function touchUserPresence(userId: string): Promise<void> {
  await ensureLastSeenColumn();
  await prisma.$executeRaw`
    UPDATE "User" SET "lastSeenAt" = NOW(), "updatedAt" = NOW() WHERE id = ${userId}
  `;
}

/** Marca o usuário como offline imediatamente (ao sair do painel ou fazer logout). */
export async function clearUserPresence(userId: string): Promise<void> {
  await ensureLastSeenColumn();
  await prisma.$executeRaw`
    UPDATE "User" SET "lastSeenAt" = NULL, "updatedAt" = NOW() WHERE id = ${userId}
  `;
}

export async function getPresenceByProfileId(profileId: string): Promise<{
  online: boolean;
  lastSeenAt: string | null;
}> {
  await ensureLastSeenColumn();
  const rows = await prisma.$queryRaw<Array<{ lastSeenAt: Date | null }>>`
    SELECT u."lastSeenAt"
    FROM "Profile" p
    INNER JOIN "User" u ON u.id = p."userId"
    WHERE p.id = ${profileId}
    LIMIT 1
  `;
  const lastSeenAt = rows[0]?.lastSeenAt ?? null;
  return {
    online: isOnlineFromLastSeen(lastSeenAt),
    lastSeenAt: lastSeenAt ? new Date(lastSeenAt).toISOString() : null,
  };
}
