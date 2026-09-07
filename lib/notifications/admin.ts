/**
 * Helpers para painel admin futuro (sem UI nesta etapa — admin bloqueado).
 */

import {
  countDeliveriesByStatus,
  listFailedDeliveries,
  ensureNotificationDeliveryTable,
} from "@/lib/notifications/queue";
import { blockUserNotifications } from "@/lib/notifications/preferences";
import { isWhatsAppEnabled, getWhatsAppConfig } from "@/lib/notifications/config";
import { notify } from "@/lib/notifications/service";
import type { NotificationEvent, SafeNotificationPayload } from "@/lib/notifications/types";
import { prisma } from "@/lib/db";

export async function getNotificationAdminOverview() {
  await ensureNotificationDeliveryTable();
  const counts = await countDeliveriesByStatus(30);
  const failures = await listFailedDeliveries(20);
  const cfg = getWhatsAppConfig();
  return {
    whatsappEnabled: isWhatsAppEnabled(),
    whatsappConfigured: Boolean(cfg.phoneNumberId && cfg.accessToken),
    /** Custos: placeholder até ativar Cloud API com billing */
    estimatedCostCents: 0,
    counts,
    recentFailures: failures.map((f) => ({
      id: f.id,
      userId: f.userId,
      event: f.event,
      channel: f.channel,
      errorCode: f.errorCode,
      lastError: f.lastError,
      createdAt: f.createdAt,
    })),
  };
}

export async function adminBlockUserNotifications(userId: string, blocked: boolean) {
  await blockUserNotifications(userId, blocked);
}

/** Reenvio apenas se status failed/skipped e canal permitido. */
export async function adminResendDelivery(params: {
  userId: string;
  event: NotificationEvent;
  payload: SafeNotificationPayload;
  idempotencyKey: string;
}) {
  return notify({
    userId: params.userId,
    event: params.event,
    payload: params.payload,
    idempotencyKey: `${params.idempotencyKey}:retry:${Date.now()}`,
  });
}

export async function adminSetChannelFlag(_enabled: boolean) {
  // Canal global controlado por WHATSAPP_ENABLED no servidor — não alterar via DB nesta etapa.
  return {
    note: "Altere WHATSAPP_ENABLED no ambiente do servidor e reinicie o app.",
    current: isWhatsAppEnabled(),
  };
}

export async function countUsersWithWhatsAppOptIn(): Promise<number> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ c: number }>>(
      `SELECT COUNT(*)::int AS c FROM "user_notification_preferences"
       WHERE "whatsappEnabled" = true AND "whatsappConsent" = true AND "blocked" = false`,
    );
    return Number(rows[0]?.c || 0);
  } catch {
    return 0;
  }
}
