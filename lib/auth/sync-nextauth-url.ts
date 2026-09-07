/**
 * Garante NEXTAUTH_URL igual ao host real da requisição.
 * Evita OAuth quebrado quando a env na Vercel ainda aponta para localhost
 * ou para o domínio sem www.
 */
export function syncNextAuthUrlFromRequest(req: Request): void {
  const vercel = process.env.VERCEL === "1";
  const prod = process.env.NODE_ENV === "production";
  if (!vercel && !prod) return;

  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  if (!host || host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return;
  }

  const proto = (req.headers.get("x-forwarded-proto") || "https")
    .split(",")[0]
    .trim()
    .toLowerCase();
  const origin = `${proto === "http" ? "https" : proto}://${host}`;

  if (origin.startsWith("https://")) {
    process.env.NEXTAUTH_URL = origin;
  }
}
