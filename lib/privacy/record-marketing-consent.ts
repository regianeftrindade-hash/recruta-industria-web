import { prisma } from "@/lib/db";
import {
  buildMarketingConsentSnapshot,
  MARKETING_CONSENT_ACTIONS,
  normalizeMarketingConsentFlag,
  readMarketingConsentFromUnknown,
  type MarketingConsentState,
} from "@/lib/privacy/marketing-consent";
import { getProfileFormSnapshot, saveProfileFormSnapshot } from "@/lib/profile/profile-snapshot";
import { getPersistedAuditLogs, logAudit } from "@/lib/security/audit-store";

/** Mescla flags de marketing no snapshot do formulário (estado + data). */
export function mergeMarketingConsentIntoFormJson(
  formDataJSON: string | null | undefined,
  granted: boolean,
  at: Date = new Date(),
): string {
  let base: Record<string, unknown> = {};
  if (formDataJSON?.trim()) {
    try {
      const parsed = JSON.parse(formDataJSON) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        base = { ...(parsed as Record<string, unknown>) };
      }
    } catch {
      base = {};
    }
  }
  Object.assign(base, buildMarketingConsentSnapshot(granted, at));
  return JSON.stringify(base);
}

export async function persistMarketingConsentForUser(options: {
  userId: string;
  email: string;
  granted: boolean;
  ip?: string;
  userAgent?: string;
}): Promise<MarketingConsentState> {
  const at = new Date();
  const snap = buildMarketingConsentSnapshot(options.granted, at);
  const profile = await prisma.profile.findUnique({
    where: { userId: options.userId },
    select: { userId: true },
  });
  if (profile) {
    const current = await getProfileFormSnapshot(options.userId);
    const nextJson = mergeMarketingConsentIntoFormJson(current, options.granted, at);
    await saveProfileFormSnapshot(options.userId, nextJson);
  }

  logAudit(
    options.granted ? MARKETING_CONSENT_ACTIONS.grant : MARKETING_CONSENT_ACTIONS.withdraw,
    options.email,
    options.ip || "unknown",
    options.userAgent || "unknown",
    "success",
    JSON.stringify(snap),
  );

  return { granted: options.granted, recordedAt: snap.marketingConsentAt };
}

function stateFromAuditDetails(details: string | undefined): MarketingConsentState | null {
  if (!details) return null;
  try {
    const parsed = JSON.parse(details) as Record<string, unknown>;
    const state = readMarketingConsentFromUnknown(parsed);
    if (state.recordedAt) return state;
  } catch {
    return null;
  }
  return null;
}

export async function readMarketingConsentForUser(
  userId: string,
  email?: string | null,
): Promise<MarketingConsentState> {
  const raw = await getProfileFormSnapshot(userId);
  if (raw) {
    try {
      const fromProfile = readMarketingConsentFromUnknown(JSON.parse(raw));
      if (fromProfile.recordedAt) return fromProfile;
    } catch {
      // continua para audit
    }
  }

  if (email) {
    const grantLogs = await getPersistedAuditLogs({
      limit: 1,
      action: MARKETING_CONSENT_ACTIONS.grant,
      email,
    });
    const withdrawLogs = await getPersistedAuditLogs({
      limit: 1,
      action: MARKETING_CONSENT_ACTIONS.withdraw,
      email,
    });
    const candidates = [grantLogs[0], withdrawLogs[0]].filter(Boolean) as Array<{
      timestamp: number;
      details: string;
    }>;
    candidates.sort((a, b) => b.timestamp - a.timestamp);
    const fromAudit = stateFromAuditDetails(candidates[0]?.details);
    if (fromAudit) return fromAudit;
  }

  return { granted: false, recordedAt: null };
}

export function marketingConsentFromRegisterBody(body: Record<string, unknown>): boolean {
  return normalizeMarketingConsentFlag(
    body.marketingConsent ?? body.aceitoMarketing ?? body.acceptMarketing,
  );
}
