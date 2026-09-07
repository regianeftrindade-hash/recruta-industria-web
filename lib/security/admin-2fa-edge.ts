import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "ri_admin_2fa";
const TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

function secret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.ADMIN_API_KEY || "dev-only-insecure";
}

/** Em produção, 2FA admin liga por padrão. Desligue com ENABLE_ADMIN_2FA=false. */
export function isAdmin2faRequired(): boolean {
  const flag = process.env.ENABLE_ADMIN_2FA?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;
  return process.env.NODE_ENV === "production";
}

export function createAdmin2faToken(email: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = `${email.toLowerCase().trim()}:${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyAdmin2faToken(token: string | undefined, email: string): boolean {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split(":");
    if (parts.length !== 3) return false;
    const [tokenEmail, expStr, sig] = parts;
    const exp = Number(expStr);
    if (!tokenEmail || !sig || !Number.isFinite(exp) || Date.now() > exp) return false;
    if (tokenEmail.toLowerCase() !== email.toLowerCase().trim()) return false;

    const payload = `${tokenEmail}:${expStr}`;
    const expected = createHmac("sha256", secret()).update(payload).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const ADMIN_2FA_COOKIE = COOKIE_NAME;

export function admin2faCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(TTL_MS / 1000),
  };
}
