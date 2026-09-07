/**
 * Serviço principal de notificações — não mistura com OpenAI.
 * Enfileira de forma assíncrona (não deixa a página lenta).
 */

import { NOTIFICATION_DEFAULT_CHANNELS, NOTIFICATION_RETRY } from "@/lib/notifications/config";
import { getProviderForChannel } from "@/lib/notifications/providers";
import {
  canSendWhatsApp,
  getUserNotificationPreferences,
} from "@/lib/notifications/preferences";
import { enqueueDelivery, updateDeliveryStatus } from "@/lib/notifications/queue";
import { renderTemplate } from "@/lib/notifications/templates/pt-BR";
import { pickSafeMetadata } from "@/lib/notifications/sanitize";
import type {
  NotificationChannel,
  NotificationJobInput,
  NotificationSkipReason,
} from "@/lib/notifications/types";
import { prisma } from "@/lib/db";

async function resolveRecipientEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email || null;
}

async function processChannel(
  input: NotificationJobInput,
  channel: NotificationChannel,
  templateKey: string,
  title: string,
  bodyText: string,
  platformPath: string,
): Promise<void> {
  const prefs = await getUserNotificationPreferences(input.userId);
  if (prefs.blocked) {
    return;
  }

  if (channel === "IN_APP" && !prefs.inAppEnabled) return;
  if (channel === "EMAIL" && !prefs.emailEnabled) return;
  if (channel === "WHATSAPP") {
    const gate = canSendWhatsApp(prefs);
    if (!gate.ok) {
      const idem = `${input.idempotencyKey}:${channel}:skip`;
      const { id, duplicate } = await enqueueDelivery({
        userId: input.userId,
        event: input.event,
        channel,
        templateKey,
        idempotencyKey: idem,
        payloadSummary: bodyText.slice(0, 200),
        recipientHint: prefs.resolvedPhoneE164
          ? `***${prefs.resolvedPhoneE164.slice(-4)}`
          : null,
        provider: "whatsapp",
      });
      if (!duplicate && id) {
        await updateDeliveryStatus({
          id,
          status: "skipped",
          errorCode: gate.reason as NotificationSkipReason,
          lastError: gate.reason || "skipped",
        });
      }
      return;
    }
  }

  const idempotencyKey = `${input.idempotencyKey}:${channel}`;
  const provider = getProviderForChannel(channel);
  const recipient =
    channel === "WHATSAPP"
      ? (await getUserNotificationPreferences(input.userId)).resolvedPhoneE164 || ""
      : channel === "EMAIL"
        ? (await resolveRecipientEmail(input.userId)) || ""
        : input.userId;

  const { id, duplicate } = await enqueueDelivery({
    userId: input.userId,
    event: input.event,
    channel,
    templateKey,
    idempotencyKey,
    payloadSummary: `${title} | ${bodyText}`.slice(0, 300),
    recipientHint:
      channel === "WHATSAPP" && recipient
        ? `***${recipient.slice(-4)}`
        : channel === "EMAIL"
          ? recipient.replace(/(^.).*(@.*$)/, "$1***$2")
          : null,
    provider: provider.name,
  });

  if (duplicate) return;
  if (!id) return;

  try {
    await updateDeliveryStatus({ id, status: "processing", incrementAttempt: true });
    const result = await provider.send({
      to: recipient,
      userId: input.userId,
      event: input.event,
      templateKey,
      bodyText,
      payload: {
        ...input.payload,
        platformPath,
        eventLabel: title,
      },
    });

    await updateDeliveryStatus({
      id,
      status: result.status,
      providerMessageId: result.providerMessageId,
      errorCode: result.errorCode || null,
      lastError: result.errorMessage || null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "erro";
    const temporary = NOTIFICATION_RETRY.temporaryErrorCodes.has(msg) || /timeout|ECONN/i.test(msg);
    await updateDeliveryStatus({
      id,
      status: "failed",
      errorCode: temporary ? "TEMPORARY_FAILURE" : "failed",
      lastError: msg.slice(0, 500),
    });
  }
}

/**
 * Enfileira notificação multi-canal sem bloquear (fire-and-forget).
 * Não envia WhatsApp real nesta etapa.
 */
export function notifyAsync(input: NotificationJobInput): void {
  void notify(input).catch((err) => {
    console.error("[notifications] notifyAsync:", err);
  });
}

export async function notify(input: NotificationJobInput): Promise<{ queued: number; skipped: number }> {
  const rendered = renderTemplate(input.event, {
    ...input.payload,
    // força path limpo
    platformPath: input.payload.platformPath.split("?")[0] || "/login",
  });
  if (!rendered) {
    return { queued: 0, skipped: 1 };
  }

  const defaults = NOTIFICATION_DEFAULT_CHANNELS[input.event] || ["IN_APP"];
  const channels = (input.channels || [...defaults]) as NotificationChannel[];
  void pickSafeMetadata(input.metadata || null);

  let queued = 0;
  let skipped = 0;
  for (const channel of channels) {
    try {
      await processChannel(
        input,
        channel,
        rendered.templateKey,
        rendered.title,
        rendered.bodyText,
        input.payload.platformPath.split("?")[0],
      );
      queued += 1;
    } catch {
      skipped += 1;
    }
  }
  return { queued, skipped };
}
