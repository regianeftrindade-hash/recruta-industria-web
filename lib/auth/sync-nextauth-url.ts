const PRODUCTION_AUTH_URL = "https://www.recrutaindustria.com";

function isLocalhostUrl(value: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(value);
}

/**
 * Fixa NEXTAUTH_URL no domínio público.
 *
 * Production: sempre www.recrutaindustria.com.
 * Preview: preserva NEXTAUTH_URL estável já configurada (ex.: alias
 * recruta-industria-preview-stripe.vercel.app) para cookies de sessão e
 * retorno do Stripe. Só usa o host efêmero VERCEL_URL se a env estiver
 * ausente ou em localhost.
 */
export function ensureProductionNextAuthUrl(): void {
  if (process.env.VERCEL_ENV === "preview") {
    const configured = (process.env.NEXTAUTH_URL || "").trim().replace(/\/$/, "");
    if (configured && !isLocalhostUrl(configured)) {
      process.env.NEXTAUTH_URL = configured;
      return;
    }
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
