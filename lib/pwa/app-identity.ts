/** Identidade do app para lojas e Digital Asset Links (TWA / Play Store). */
export const ANDROID_PACKAGE_NAME =
  (process.env.ANDROID_PACKAGE_NAME || "com.recrutaindustria.app").trim();

export function getAndroidSha256Fingerprints(): string[] {
  const raw = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS || "").trim();
  if (!raw) return [];
  return raw
    .split(/[,;\s]+/)
    .map((item) => item.trim().toUpperCase().replace(/[^0-9A-F]/g, ""))
    .filter((item) => item.length === 64)
    .map((item) => item.match(/.{2}/g)?.join(":") || item);
}

/** App ID da Apple no formato TEAMID.com.bundle */
export function getIosAppId(): string {
  return (process.env.IOS_TEAM_APP_ID || "").trim();
}
