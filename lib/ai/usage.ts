import { prisma } from "@/lib/db";
import { AI_MONTHLY_LIMITS, AI_RATE_LIMIT } from "@/lib/ai/config";
import type { AiCapabilityTier, AiUsageSnapshot } from "@/lib/ai/types";

let usageTableReady = false;

export async function ensureAssistantUsageTable(): Promise<void> {
  if (usageTableReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "assistant_usage" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "periodKey" TEXT NOT NULL,
        "tokensIn" INTEGER NOT NULL DEFAULT 0,
        "tokensOut" INTEGER NOT NULL DEFAULT 0,
        "requestCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "assistant_usage_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "assistant_usage_userId_periodKey_key" ON "assistant_usage"("userId", "periodKey")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "assistant_usage_periodKey_idx" ON "assistant_usage"("periodKey")`,
    );

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "assistant_conversations" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "title" TEXT,
        "messages" TEXT NOT NULL DEFAULT '[]',
        "model" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "assistant_conversations_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "assistant_conversations_userId_updatedAt_idx" ON "assistant_conversations"("userId", "updatedAt")`,
    );

    usageTableReady = true;
  } catch (error) {
    console.error("[ai] Falha ao garantir tabelas do assistente:", error);
    throw error;
  }
}

export function currentPeriodKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function getUsageSnapshot(
  userId: string,
  capability: AiCapabilityTier,
): Promise<AiUsageSnapshot> {
  await ensureAssistantUsageTable();
  const periodKey = currentPeriodKey();
  const limit = AI_MONTHLY_LIMITS[capability];

  const rows = await prisma.$queryRawUnsafe<Array<{ requestCount: number }>>(
    `SELECT "requestCount" FROM "assistant_usage"
     WHERE "userId" = $1 AND "periodKey" = $2
     LIMIT 1`,
    userId,
    periodKey,
  );

  const used = Number(rows[0]?.requestCount || 0);
  return {
    periodKey,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function assertWithinMonthlyLimit(
  userId: string,
  capability: AiCapabilityTier,
): Promise<AiUsageSnapshot> {
  const snap = await getUsageSnapshot(userId, capability);
  if (snap.used >= snap.limit) {
    const err = new Error("AI_MONTHLY_LIMIT");
    (err as Error & { usage: AiUsageSnapshot }).usage = snap;
    throw err;
  }
  return snap;
}

export async function incrementUsage(params: {
  userId: string;
  tokensIn?: number;
  tokensOut?: number;
}): Promise<void> {
  await ensureAssistantUsageTable();
  const periodKey = currentPeriodKey();
  const id = `au_${params.userId.slice(0, 8)}_${periodKey.replace("-", "")}_${Date.now().toString(36)}`;
  const tokensIn = Math.max(0, Math.floor(params.tokensIn || 0));
  const tokensOut = Math.max(0, Math.floor(params.tokensOut || 0));

  await prisma.$executeRawUnsafe(
    `INSERT INTO "assistant_usage" ("id", "userId", "periodKey", "tokensIn", "tokensOut", "requestCount", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
     ON CONFLICT ("userId", "periodKey")
     DO UPDATE SET
       "tokensIn" = "assistant_usage"."tokensIn" + EXCLUDED."tokensIn",
       "tokensOut" = "assistant_usage"."tokensOut" + EXCLUDED."tokensOut",
       "requestCount" = "assistant_usage"."requestCount" + 1,
       "updatedAt" = NOW()`,
    id,
    params.userId,
    periodKey,
    tokensIn,
    tokensOut,
  );
}

/** Rate limit simples em memória (por processo). */
const recentHits = new Map<string, number[]>();

export function assertRateLimit(userId: string): void {
  const now = Date.now();
  const windowMs = 60_000;
  const hits = (recentHits.get(userId) || []).filter((t) => now - t < windowMs);
  if (hits.length >= AI_RATE_LIMIT.maxPerMinute) {
    throw new Error("AI_RATE_LIMIT");
  }
  hits.push(now);
  recentHits.set(userId, hits);
}

export function sanitizeUserMessage(raw: string): string {
  return String(raw || "")
    .trim()
    .replace(/\0/g, "")
    .slice(0, AI_RATE_LIMIT.maxMessageChars);
}

export function sanitizeContext(context: unknown): Record<string, unknown> | null {
  if (!context || typeof context !== "object" || Array.isArray(context)) return null;
  const json = JSON.stringify(context);
  if (json.length > AI_RATE_LIMIT.maxContextChars) {
    return { _truncated: true, preview: json.slice(0, AI_RATE_LIMIT.maxContextChars) };
  }
  return context as Record<string, unknown>;
}
