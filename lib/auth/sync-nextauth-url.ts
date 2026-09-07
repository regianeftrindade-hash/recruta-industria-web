const PRODUCTION_AUTH_URL = "https://www.recrutaindustria.com";

/**
 * Fixa NEXTAUTH_URL no domínio público.
 * Se a env na Vercel for localhost ou *.vercel.app, o Google volta com
 * redirect_uri diferente do da ida e o NextAuth responde OAuthCallback.
 */
export function ensureProductionNextAuthUrl(): void {
  if (process.env.VERCEL_ENV === "preview") {
    const host = process.env.VERCEL_URL?.replace(/^https?:\/\//, "").trim();
    if (host) process.env.NEXTAUTH_URL = `https://${host}`;
    return;
  }

  const onVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production";
  if (!onVercel) return;

  process.env.NEXTAUTH_URL = PRODUCTION_AUTH_URL;
}

export function syncNextAuthUrlFromRequest(_req: Request): void {
  ensureProductionNextAuthUrl();
}
