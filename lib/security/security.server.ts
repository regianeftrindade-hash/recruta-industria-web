import crypto, { createHmac, timingSafeEqual } from "crypto";

export async function hashPassword(password: string) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}

const RESET_TTL_MS = 60 * 60 * 1000;

/** Tokens já usados (one-time). Em multi-instância sem Redis é best-effort. */
const consumedResetTokens = new Set<string>();

function resetSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.PASSWORD_RESET_SECRET?.trim() ||
    "dev-only-insecure-reset"
  );
}

function signResetBody(body: string): string {
  return createHmac("sha256", resetSecret()).update(body).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    return ba.length === bb.length && timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

type ResetPayload = {
  email: string;
  exp: number;
  n: string;
};

/**
 * Token assinado (HMAC) — válido em qualquer instância serverless (Vercel).
 * Antes era Map em memória: POST criava numa máquina e o GET falhava em outra → “expirado”.
 */
export function generatePasswordResetToken(email: string): string {
  const payload: ResetPayload = {
    email: email.toLowerCase().trim(),
    exp: Date.now() + RESET_TTL_MS,
    n: crypto.randomBytes(8).toString("hex"),
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = signResetBody(body);
  return `${body}.${sig}`;
}

export function verifyPasswordResetToken(token: string): string | null {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  if (consumedResetTokens.has(token)) return null;

  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = signResetBody(body);
    if (!safeEqualHex(sig, expected)) return null;

    const raw = Buffer.from(body, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as ResetPayload;
    const email = typeof parsed.email === "string" ? parsed.email.toLowerCase().trim() : "";
    const exp = Number(parsed.exp);
    if (!email || !Number.isFinite(exp) || Date.now() > exp) return null;
    return email;
  } catch {
    return null;
  }
}

export function consumePasswordResetToken(token: string): void {
  consumedResetTokens.add(token);
  // Evita crescimento infinito em processo longo
  if (consumedResetTokens.size > 5000) {
    const first = consumedResetTokens.values().next().value;
    if (first) consumedResetTokens.delete(first);
  }
}

/** Gera código 2FA criptograficamente seguro (6 dígitos). */
export function generateSecureOtpCode(): string {
  return String(crypto.randomInt(100000, 999999));
}
