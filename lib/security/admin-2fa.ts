export {
  ADMIN_2FA_COOKIE,
  admin2faCookieOptions,
  createAdmin2faToken,
  isAdmin2faRequired,
  verifyAdmin2faToken,
} from "@/lib/security/admin-2fa-edge";

import { prisma } from "@/lib/db";
import { ensureSecurityAuditTable } from "@/lib/security/audit-store";

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
