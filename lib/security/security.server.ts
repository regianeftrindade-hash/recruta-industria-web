import crypto from "crypto";

export async function hashPassword(password: string) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}

export {
  PASSWORD_RESET_TTL_MS,
  issuePasswordResetToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/security/password-reset-token";

/** Gera código 2FA criptograficamente seguro (6 dígitos). */
export function generateSecureOtpCode(): string {
  return String(crypto.randomInt(100000, 999999));
}
