export {
  ADMIN_2FA_COOKIE,
  admin2faCookieOptions,
  createAdmin2faToken,
  isAdmin2faRequired,
  verifyAdmin2faToken,
} from "@/lib/security/admin-2fa-edge";

import { prisma } from "@/lib/db";
import { ensureSecurityAuditTable } from "@/lib/security/audit-store";
import { store2FACode, verify2FACode } from "@/lib/security";

const ADMIN_OTP_PREFIX = "admin2fa:";
const OTP_MINUTES = 5;

function otpEmailKey(email: string): string {
  return `${ADMIN_OTP_PREFIX}${email.toLowerCase().trim()}`;
}

/** Guarda o código no banco (Vercel não compartilha memória entre instâncias). */
export async function persistAdmin2faCode(email: string, code: string): Promise<void> {
  const key = otpEmailKey(email);
  const expiresAt = new Date(Date.now() + OTP_MINUTES * 60 * 1000);
  store2FACode(`admin:${email.toLowerCase().trim()}`, code);
  await prisma.emailVerification.deleteMany({ where: { email: key } });
  await prisma.emailVerification.create({
    data: { email: key, code, expiresAt },
  });
}

export async function consumeAdmin2faCode(email: string, code: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const trimmed = String(code || "").trim();
  if (verify2FACode(`admin:${normalized}`, trimmed, OTP_MINUTES)) {
    await prisma.emailVerification.deleteMany({ where: { email: otpEmailKey(normalized) } }).catch(() => undefined);
    return true;
  }

  const key = otpEmailKey(normalized);
  const row = await prisma.emailVerification.findFirst({
    where: { email: key, code: trimmed, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return false;
  await prisma.emailVerification.deleteMany({ where: { email: key } });
  return true;
}

/** Marca no banco que o admin passou pelo 2FA nesta sessão (auditoria). */
export async function recordAdmin2faSuccess(email: string, ip: string): Promise<void> {
  try {
    await ensureSecurityAuditTable();
    await prisma.$executeRaw`
      INSERT INTO "SecurityAuditLog" (id, action, email, ip, "userAgent", result, details, "createdAt")
      VALUES (
        ${`al_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`},
        ${"admin_2fa_success"},
        ${email.toLowerCase().trim()},
        ${ip},
        ${"admin-2fa"},
        ${"success"},
        ${"2FA admin validado"},
        NOW()
      )
    `;
  } catch {
    /* ignore */
  }
}
