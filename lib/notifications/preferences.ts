/**
 * Preferências de notificação por usuário.
 * Telefone: reutiliza Profile.whatsapp / Profile.phone / Company.telefone
 * (não cria coluna de telefone duplicada). Consentimento WhatsApp é explícito.
 */

import { prisma } from "@/lib/db";
import { normalizePhoneE164 } from "@/lib/notifications/sanitize";

export type UserNotificationPreferences = {
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  phoneVerified: boolean;
  whatsappConsent: boolean;
  whatsappConsentAt: string | null;
  /** Número resolvido dos campos já existentes (não é autorização) */
  resolvedPhoneE164: string | null;
  blocked: boolean;
};

let prefTableReady = false;

export async function ensureNotificationPreferenceTable(): Promise<void> {
  if (prefTableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
      "userId" TEXT NOT NULL,
      "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
      "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
      "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
      "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
      "whatsappConsent" BOOLEAN NOT NULL DEFAULT false,
      "whatsappConsentAt" TIMESTAMP(3),
      "blocked" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("userId")
    )
  `);
  prefTableReady = true;
}

async function resolveExistingPhone(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      profile: { select: { phone: true, whatsapp: true } },
      company: { select: { telefone: true } },
    },
  });
  if (!user) return null;
  if (user.role === "COMPANY") {
    return normalizePhoneE164(user.company?.telefone);
  }
  return (
    normalizePhoneE164(user.profile?.whatsapp) ||
    normalizePhoneE164(user.profile?.phone)
  );
}

type PrefRow = {
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  phoneVerified: boolean;
  whatsappConsent: boolean;
  whatsappConsentAt: Date | null;
  blocked: boolean;
};

export async function getUserNotificationPreferences(
  userId: string,
): Promise<UserNotificationPreferences> {
  await ensureNotificationPreferenceTable();
  const rows = await prisma.$queryRawUnsafe<PrefRow[]>(
    `SELECT * FROM "user_notification_preferences" WHERE "userId" = $1 LIMIT 1`,
    userId,
  );
  const row = rows[0];
  const resolvedPhoneE164 = await resolveExistingPhone(userId);

  if (!row) {
    return {
      userId,
      inAppEnabled: true,
      emailEnabled: true,
      whatsappEnabled: false,
      phoneVerified: false,
      whatsappConsent: false,
      whatsappConsentAt: null,
      resolvedPhoneE164,
      blocked: false,
    };
  }

  return {
    userId,
    inAppEnabled: Boolean(row.inAppEnabled),
    emailEnabled: Boolean(row.emailEnabled),
    whatsappEnabled: Boolean(row.whatsappEnabled),
    phoneVerified: Boolean(row.phoneVerified),
    whatsappConsent: Boolean(row.whatsappConsent),
    whatsappConsentAt: row.whatsappConsentAt
      ? new Date(row.whatsappConsentAt).toISOString()
      : null,
    resolvedPhoneE164,
    blocked: Boolean(row.blocked),
  };
}

export async function updateUserNotificationPreferences(
  userId: string,
  patch: Partial<{
    inAppEnabled: boolean;
    emailEnabled: boolean;
    whatsappEnabled: boolean;
    phoneVerified: boolean;
    whatsappConsent: boolean;
    blocked: boolean;
  }>,
): Promise<UserNotificationPreferences> {
  await ensureNotificationPreferenceTable();
  const current = await getUserNotificationPreferences(userId);

  let whatsappConsent = current.whatsappConsent;
  let whatsappConsentAt: Date | null = current.whatsappConsentAt
    ? new Date(current.whatsappConsentAt)
    : null;

  if (typeof patch.whatsappConsent === "boolean") {
    if (patch.whatsappConsent && !current.whatsappConsent) {
      whatsappConsent = true;
      whatsappConsentAt = new Date();
    } else if (!patch.whatsappConsent) {
      whatsappConsent = false;
      // Mantém data histórica do último consentimento; desligar não apaga auditoria
    }
  }

  // Ativar WhatsApp exige consentimento explícito no mesmo request ou já gravado
  let whatsappEnabled =
    typeof patch.whatsappEnabled === "boolean"
      ? patch.whatsappEnabled
      : current.whatsappEnabled;
  if (whatsappEnabled && !whatsappConsent) {
    whatsappEnabled = false;
  }

  const next = {
    inAppEnabled:
      typeof patch.inAppEnabled === "boolean" ? patch.inAppEnabled : current.inAppEnabled,
    emailEnabled:
      typeof patch.emailEnabled === "boolean" ? patch.emailEnabled : current.emailEnabled,
    whatsappEnabled,
    phoneVerified:
      typeof patch.phoneVerified === "boolean" ? patch.phoneVerified : current.phoneVerified,
    whatsappConsent,
    whatsappConsentAt,
    blocked: typeof patch.blocked === "boolean" ? patch.blocked : current.blocked,
  };

  await prisma.$executeRawUnsafe(
    `INSERT INTO "user_notification_preferences" (
       "userId", "inAppEnabled", "emailEnabled", "whatsappEnabled",
       "phoneVerified", "whatsappConsent", "whatsappConsentAt", "blocked",
       "createdAt", "updatedAt"
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
     ON CONFLICT ("userId") DO UPDATE SET
       "inAppEnabled" = EXCLUDED."inAppEnabled",
       "emailEnabled" = EXCLUDED."emailEnabled",
       "whatsappEnabled" = EXCLUDED."whatsappEnabled",
       "phoneVerified" = EXCLUDED."phoneVerified",
       "whatsappConsent" = EXCLUDED."whatsappConsent",
       "whatsappConsentAt" = COALESCE(EXCLUDED."whatsappConsentAt", "user_notification_preferences"."whatsappConsentAt"),
       "blocked" = EXCLUDED."blocked",
       "updatedAt" = NOW()`,
    userId,
    next.inAppEnabled,
    next.emailEnabled,
    next.whatsappEnabled,
    next.phoneVerified,
    next.whatsappConsent,
    next.whatsappConsentAt,
    next.blocked,
  );

  return getUserNotificationPreferences(userId);
}

/** Pode enviar WhatsApp? Número existente NÃO basta — precisa consentimento + verificação + opt-in. */
export function canSendWhatsApp(prefs: UserNotificationPreferences): {
  ok: boolean;
  reason?: string;
} {
  if (prefs.blocked) return { ok: false, reason: "USER_BLOCKED" };
  if (!prefs.whatsappEnabled) return { ok: false, reason: "CHANNEL_DISABLED_BY_USER" };
  if (!prefs.whatsappConsent) return { ok: false, reason: "NO_CONSENT" };
  if (!prefs.phoneVerified) return { ok: false, reason: "PHONE_UNVERIFIED" };
  if (!prefs.resolvedPhoneE164) return { ok: false, reason: "INVALID_NUMBER" };
  return { ok: true };
}

/** Admin: bloquear notificações de um usuário. */
export async function blockUserNotifications(userId: string, blocked: boolean): Promise<void> {
  await updateUserNotificationPreferences(userId, { blocked });
}
