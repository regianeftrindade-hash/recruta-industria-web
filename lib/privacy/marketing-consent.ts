/**
 * Consentimento de marketing (comunicações opcionais).
 * Estado + data registrados via SecurityAuditLog (sem migração de schema).
 * Cookie de Ads permanece em ri_cookie_consent (opt-in separado).
 */

export const MARKETING_CONSENT_ACTIONS = {
  grant: "marketing_consent_grant",
  withdraw: "marketing_consent_withdraw",
  snapshot: "marketing_consent_state",
} as const;

export type MarketingConsentState = {
  granted: boolean;
  /** ISO timestamp do último registro conhecido; null se nunca registrado. */
  recordedAt: string | null;
};

export function normalizeMarketingConsentFlag(value: unknown): boolean {
  if (value === true || value === 1 || value === "1") return true;
  if (typeof value === "string" && value.trim().toLowerCase() === "true") return true;
  return false;
}

/** Snapshot serializável para formDataJSON / auditoria (sem inventar prazos). */
export function buildMarketingConsentSnapshot(
  granted: boolean,
  at: Date = new Date(),
): { marketingConsent: boolean; marketingConsentAt: string } {
  return {
    marketingConsent: Boolean(granted),
    marketingConsentAt: at.toISOString(),
  };
}

export function readMarketingConsentFromUnknown(
  source: unknown,
): MarketingConsentState {
  if (!source || typeof source !== "object") {
    return { granted: false, recordedAt: null };
  }
  const obj = source as Record<string, unknown>;
  const granted = normalizeMarketingConsentFlag(obj.marketingConsent);
  const rawAt = obj.marketingConsentAt;
  const recordedAt =
    typeof rawAt === "string" && rawAt.trim() && !Number.isNaN(Date.parse(rawAt))
      ? new Date(rawAt).toISOString()
      : null;
  return { granted, recordedAt };
}
