import crypto from "crypto";

export async function hashPassword(password: string) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}

type ResetEntry = {
  email: string;
  expiresAt: number;
};

/** Tokens de reset: crypto forte + TTL (1h). Em memória — em multi-instância use Redis/DB. */
const resetTokens = new Map<string, ResetEntry>();
const RESET_TTL_MS = 60 * 60 * 1000;

function pruneExpiredTokens() {
  const now = Date.now();
  for (const [token, entry] of resetTokens.entries()) {
    if (entry.expiresAt <= now) resetTokens.delete(token);
  }
}

export function generatePasswordResetToken(email: string): string {
  pruneExpiredTokens();
  const token = crypto.randomBytes(32).toString("hex");
  resetTokens.set(token, {
    email: email.toLowerCase().trim(),
    expiresAt: Date.now() + RESET_TTL_MS,
  });
  return token;
}

export function verifyPasswordResetToken(token: string): string | null {
  pruneExpiredTokens();
  const entry = resetTokens.get(token);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    resetTokens.delete(token);
    return null;
  }
  return entry.email;
}

export function consumePasswordResetToken(token: string): void {
  resetTokens.delete(token);
}

/** Gera código 2FA criptograficamente seguro (6 dígitos). */
export function generateSecureOtpCode(): string {
  return String(crypto.randomInt(100000, 999999));
}
