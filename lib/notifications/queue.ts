/**
 * Fila/outbox de notificações — não bloqueia a request HTTP.
 * Registro: destinatário, evento, canal, modelo, status, tentativas, erro, id do provedor.
 */

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type {
  DeliveryStatus,
  NotificationChannel,
  NotificationEvent,
} from "@/lib/notifications/types";

let deliveryTableReady = false;

export async function ensureNotificationDeliveryTable(): Promise<void> {
  if (deliveryTableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "notification_deliveries" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "event" TEXT NOT NULL,
      "channel" TEXT NOT NULL,
      "templateKey" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'queued',
      "idempotencyKey" TEXT NOT NULL,
      "provider" TEXT,
      "providerMessageId" TEXT,
      "attemptCount" INTEGER NOT NULL DEFAULT 0,
      "maxAttempts" INTEGER NOT NULL DEFAULT 5,
      "lastError" TEXT,
      "errorCode" TEXT,
      "payloadSummary" TEXT,
      "recipientHint" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "attemptedAt" TIMESTAMP(3),
      "sentAt" TIMESTAMP(3),
      "deliveredAt" TIMESTAMP(3),
      "readAt" TIMESTAMP(3),
      CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "notification_deliveries_idempotency_key"
     ON "notification_deliveries"("idempotencyKey")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "notification_deliveries_user_created_idx"
     ON "notification_deliveries"("userId", "createdAt")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "notification_deliveries_status_idx"
     ON "notification_deliveries"("status")`,
  );
  deliveryTableReady = true;
}

export type DeliveryRow = {
  id: string;
  userId: string;
  event: string;
  channel: string;
  templateKey: string;
  status: string;
  idempotencyKey: string;
  provider: string | null;
  providerMessageId: string | null;
  attemptCount: number;
  maxAttempts: number;
  lastError: string | null;
  errorCode: string | null;
  payloadSummary: string | null;
  recipientHint: string | null;
  createdAt: Date;
  attemptedAt: Date | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
};

export async function enqueueDelivery(params: {
  userId: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  templateKey: string;
  idempotencyKey: string;
  payloadSummary: string;
  recipientHint?: string | null;
  provider?: string;
}): Promise<{ id: string; duplicate: boolean }> {
  await ensureNotificationDeliveryTable();
  const id = randomUUID();
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "notification_deliveries" (
         "id", "userId", "event", "channel", "templateKey", "status",
         "idempotencyKey", "provider", "payloadSummary", "recipientHint", "createdAt"
       ) VALUES ($1,$2,$3,$4,$5,'queued',$6,$7,$8,$9,NOW())`,
      id,
      params.userId,
      params.event,
      params.channel,
      params.templateKey,
      params.idempotencyKey,
      params.provider || null,
      params.payloadSummary.slice(0, 500),
      params.recipientHint || null,
    );
    return { id, duplicate: false };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/unique|duplicate/i.test(msg)) {
      return { id: "", duplicate: true };
    }
    throw error;
  }
}

export async function updateDeliveryStatus(params: {
  id: string;
  status: DeliveryStatus;
  providerMessageId?: string | null;
  errorCode?: string | null;
  lastError?: string | null;
  incrementAttempt?: boolean;
}): Promise<void> {
  await ensureNotificationDeliveryTable();
  const sentAt =
    params.status === "sent" || params.status === "simulated" ? "NOW()" : "NULL";
  const deliveredAt = params.status === "delivered" ? "NOW()" : "NULL";
  const readAt = params.status === "read" ? "NOW()" : "NULL";

  await prisma.$executeRawUnsafe(
    `UPDATE "notification_deliveries" SET
       "status" = $2,
       "providerMessageId" = COALESCE($3, "providerMessageId"),
       "errorCode" = $4,
       "lastError" = $5,
       "attemptCount" = CASE WHEN $6 THEN "attemptCount" + 1 ELSE "attemptCount" END,
       "attemptedAt" = NOW(),
       "sentAt" = CASE WHEN $2 IN ('sent','simulated') THEN NOW() ELSE "sentAt" END,
       "deliveredAt" = CASE WHEN $2 = 'delivered' THEN NOW() ELSE "deliveredAt" END,
       "readAt" = CASE WHEN $2 = 'read' THEN NOW() ELSE "readAt" END
     WHERE "id" = $1`,
    params.id,
    params.status,
    params.providerMessageId ?? null,
    params.errorCode ?? null,
    params.lastError ?? null,
    Boolean(params.incrementAttempt),
  );
  void sentAt;
  void deliveredAt;
  void readAt;
}

export async function findDeliveryByProviderMessageId(
  providerMessageId: string,
): Promise<DeliveryRow | null> {
  await ensureNotificationDeliveryTable();
  const rows = await prisma.$queryRawUnsafe<DeliveryRow[]>(
    `SELECT * FROM "notification_deliveries" WHERE "providerMessageId" = $1 LIMIT 1`,
    providerMessageId,
  );
  return rows[0] || null;
}

export async function listFailedDeliveries(limit = 50): Promise<DeliveryRow[]> {
  await ensureNotificationDeliveryTable();
  return prisma.$queryRawUnsafe(
    `SELECT * FROM "notification_deliveries"
     WHERE "status" = 'failed'
     ORDER BY "createdAt" DESC
     LIMIT $1`,
    Math.min(200, Math.max(1, limit)),
  );
}

export async function countDeliveriesByStatus(periodDays = 30): Promise<
  Array<{ status: string; channel: string; count: number }>
> {
  await ensureNotificationDeliveryTable();
  return prisma.$queryRawUnsafe(
    `SELECT "status", "channel", COUNT(*)::int AS count
     FROM "notification_deliveries"
     WHERE "createdAt" >= NOW() - ($1 || ' days')::interval
     GROUP BY "status", "channel"`,
    String(periodDays),
  );
}
