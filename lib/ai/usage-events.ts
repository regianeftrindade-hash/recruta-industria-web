/**
 * Registro detalhado de uso da IA (não é tabela de plano).
 * Campos: usuário, empresa, recurso, modelo, tokens, data, status, custo estimado.
 * Não grava prompt/resposta completos.
 */

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { currentPeriodKey, ensureAssistantUsageTable } from "@/lib/ai/usage";
import { estimateCostCents } from "@/lib/ai/limits";
import type { AiResource } from "@/lib/ai/resources";

export type AiUsageEventStatus = "ok" | "denied" | "limit" | "error" | "disabled";

let eventsReady = false;

export async function ensureAiUsageEventsTable(): Promise<void> {
  if (eventsReady) return;
  await ensureAssistantUsageTable();
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ai_usage_events" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "companyOwnerUserId" TEXT,
      "resource" TEXT NOT NULL,
      "model" TEXT,
      "tokensIn" INTEGER NOT NULL DEFAULT 0,
      "tokensOut" INTEGER NOT NULL DEFAULT 0,
      "estimatedCostCents" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL,
      "errorCode" TEXT,
      "periodKey" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ai_usage_events_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ai_usage_events_userId_periodKey_idx" ON "ai_usage_events"("userId", "periodKey")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ai_usage_events_resource_periodKey_idx" ON "ai_usage_events"("resource", "periodKey")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ai_usage_events_company_periodKey_idx" ON "ai_usage_events"("companyOwnerUserId", "periodKey")`,
  );
  eventsReady = true;
}

export async function countResourceUsage(params: {
  userId: string;
  resource: AiResource;
  periodKey?: string;
}): Promise<number> {
  await ensureAiUsageEventsTable();
  const periodKey = params.periodKey || currentPeriodKey();
  const rows = await prisma.$queryRawUnsafe<Array<{ c: number }>>(
    `SELECT COUNT(*)::int AS c FROM "ai_usage_events"
     WHERE "userId" = $1 AND "resource" = $2 AND "periodKey" = $3 AND "status" = 'ok'`,
    params.userId,
    params.resource,
    periodKey,
  );
  return Number(rows[0]?.c || 0);
}

export async function logAiUsageEvent(params: {
  userId: string;
  companyOwnerUserId?: string | null;
  resource: AiResource;
  model?: string | null;
  tokensIn?: number;
  tokensOut?: number;
  status: AiUsageEventStatus;
  errorCode?: string | null;
}): Promise<void> {
  await ensureAiUsageEventsTable();
  const tokensIn = Math.max(0, Math.floor(params.tokensIn || 0));
  const tokensOut = Math.max(0, Math.floor(params.tokensOut || 0));
  const estimatedCostCents =
    params.status === "ok" ? estimateCostCents(tokensIn, tokensOut) : 0;

  await prisma.$executeRawUnsafe(
    `INSERT INTO "ai_usage_events"
      ("id", "userId", "companyOwnerUserId", "resource", "model", "tokensIn", "tokensOut",
       "estimatedCostCents", "status", "errorCode", "periodKey", "createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())`,
    randomUUID(),
    params.userId,
    params.companyOwnerUserId || null,
    params.resource,
    params.model || null,
    tokensIn,
    tokensOut,
    estimatedCostCents,
    params.status,
    params.errorCode || null,
    currentPeriodKey(),
  );
}

/** Consulta agregada para painel admin futuro. */
export async function queryAiUsageForAdmin(params: {
  periodKey?: string;
  resource?: AiResource;
  companyOwnerUserId?: string;
  limit?: number;
}): Promise<
  Array<{
    id: string;
    userId: string;
    companyOwnerUserId: string | null;
    resource: string;
    model: string | null;
    tokensIn: number;
    tokensOut: number;
    estimatedCostCents: number;
    status: string;
    errorCode: string | null;
    periodKey: string;
    createdAt: Date;
  }>
> {
  await ensureAiUsageEventsTable();
  const periodKey = params.periodKey || currentPeriodKey();
  const limit = Math.min(500, Math.max(1, params.limit || 100));

  if (params.resource && params.companyOwnerUserId) {
    return prisma.$queryRawUnsafe(
      `SELECT * FROM "ai_usage_events"
       WHERE "periodKey" = $1 AND "resource" = $2 AND "companyOwnerUserId" = $3
       ORDER BY "createdAt" DESC LIMIT $4`,
      periodKey,
      params.resource,
      params.companyOwnerUserId,
      limit,
    );
  }
  if (params.resource) {
    return prisma.$queryRawUnsafe(
      `SELECT * FROM "ai_usage_events"
       WHERE "periodKey" = $1 AND "resource" = $2
       ORDER BY "createdAt" DESC LIMIT $3`,
      periodKey,
      params.resource,
      limit,
    );
  }
  if (params.companyOwnerUserId) {
    return prisma.$queryRawUnsafe(
      `SELECT * FROM "ai_usage_events"
       WHERE "periodKey" = $1 AND "companyOwnerUserId" = $2
       ORDER BY "createdAt" DESC LIMIT $3`,
      periodKey,
      params.companyOwnerUserId,
      limit,
    );
  }
  return prisma.$queryRawUnsafe(
    `SELECT * FROM "ai_usage_events"
     WHERE "periodKey" = $1
     ORDER BY "createdAt" DESC LIMIT $2`,
    periodKey,
    limit,
  );
}
