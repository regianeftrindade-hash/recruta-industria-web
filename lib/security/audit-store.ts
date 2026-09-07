import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

export type AuditResult = "success" | "failure";

export type AuditLogEntry = {
  id?: string;
  timestamp: number;
  action: string;
  email: string;
  ip: string;
  userAgent: string;
  result: AuditResult;
  details: string;
};

const memoryLogs: AuditLogEntry[] = [];
let tableReady = false;

export async function ensureSecurityAuditTable(): Promise<void> {
  if (tableReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SecurityAuditLog" (
        "id" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "ip" TEXT NOT NULL,
        "userAgent" TEXT NOT NULL,
        "result" TEXT NOT NULL,
        "details" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "SecurityAuditLog_createdAt_idx" ON "SecurityAuditLog"("createdAt")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "SecurityAuditLog_action_idx" ON "SecurityAuditLog"("action")`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "SecurityAuditLog_email_idx" ON "SecurityAuditLog"("email")`,
    );
    tableReady = true;
  } catch (error) {
    console.error("[audit] Falha ao garantir tabela SecurityAuditLog:", error);
  }
}

function pushMemory(log: AuditLogEntry) {
  memoryLogs.push(log);
  if (memoryLogs.length > 5000) memoryLogs.shift();
}

/** Grava auditoria em memória + banco (fire-and-forget no DB). */
export function logAudit(
  action: string,
  email: string,
  ip: string,
  userAgent: string,
  result: AuditResult,
  details: string,
): void {
  const entry: AuditLogEntry = {
    id: `al_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`,
    timestamp: Date.now(),
    action,
    email,
    ip,
    userAgent,
    result,
    details: details.slice(0, 2000),
  };

  pushMemory(entry);

  void (async () => {
    try {
      await ensureSecurityAuditTable();
      await prisma.$executeRaw`
        INSERT INTO "SecurityAuditLog" (id, action, email, ip, "userAgent", result, details, "createdAt")
        VALUES (
          ${entry.id},
          ${entry.action},
          ${entry.email},
          ${entry.ip},
          ${entry.userAgent},
          ${entry.result},
          ${entry.details},
          to_timestamp(${entry.timestamp / 1000})
        )
      `;
    } catch (error) {
      console.warn("[audit] Persistência falhou (mantido em memória):", error);
    }
  })();
}

export function getAuditLogs(limit = 100): AuditLogEntry[] {
  return memoryLogs.slice(-limit).reverse();
}

export async function getPersistedAuditLogs(options?: {
  limit?: number;
  action?: string | null;
  email?: string | null;
}): Promise<AuditLogEntry[]> {
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);
  try {
    await ensureSecurityAuditTable();

    const action = options?.action?.trim() || null;
    const email = options?.email?.trim() || null;

    let rows: Array<{
      id: string;
      action: string;
      email: string;
      ip: string;
      userAgent: string;
      result: string;
      details: string;
      createdAt: Date;
    }>;

    if (action && email) {
      rows = await prisma.$queryRaw`
        SELECT id, action, email, ip, "userAgent", result, details, "createdAt"
        FROM "SecurityAuditLog"
        WHERE action = ${action} AND email ILIKE ${`%${email}%`}
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `;
    } else if (action) {
      rows = await prisma.$queryRaw`
        SELECT id, action, email, ip, "userAgent", result, details, "createdAt"
        FROM "SecurityAuditLog"
        WHERE action = ${action}
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `;
    } else if (email) {
      rows = await prisma.$queryRaw`
        SELECT id, action, email, ip, "userAgent", result, details, "createdAt"
        FROM "SecurityAuditLog"
        WHERE email ILIKE ${`%${email}%`}
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `;
    } else {
      rows = await prisma.$queryRaw`
        SELECT id, action, email, ip, "userAgent", result, details, "createdAt"
        FROM "SecurityAuditLog"
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `;
    }

    return rows.map((r) => ({
      id: r.id,
      timestamp: new Date(r.createdAt).getTime(),
      action: r.action,
      email: r.email,
      ip: r.ip,
      userAgent: r.userAgent,
      result: (r.result === "failure" ? "failure" : "success") as AuditResult,
      details: r.details,
    }));
  } catch (error) {
    console.warn("[audit] Leitura do banco falhou — memória:", error);
    return getAuditLogs(limit);
  }
}
