import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
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

/**
 * Emite token de uso único persistido (Postgres).
 * Armazena só o hash; invalida tokens anteriores ainda válidos do mesmo e-mail.
 */
export async function issuePasswordResetToken(email: string): Promise<string> {
  const normalized = email.toLowerCase().trim();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { email: normalized, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        email: normalized,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  return token;
}

/** Valida assinatura/existência sem consumir (GET de pré-visualização). */
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  if (!token || typeof token !== "string") return null;
  const tokenHash = hashResetToken(token);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { email: true, expiresAt: true, usedAt: true, tokenHash: true },
  });
  if (!row) return null;
  if (row.usedAt) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;
  if (!safeEqualHex(row.tokenHash, tokenHash)) return null;
  return row.email;
}

/**
 * Consome atomicamente. Retorna o e-mail se este foi o primeiro uso válido;
 * null se expirado, inexistente ou já usado (protege reutilização em corrida).
 */
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  if (!token || typeof token !== "string") return null;
  const tokenHash = hashResetToken(token);
  const now = new Date();
  const updated = await prisma.passwordResetToken.updateMany({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
    data: { usedAt: now },
  });
  if (updated.count !== 1) return null;
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { email: true },
  });
  return row?.email ?? null;
}

/** Compat: gera token persistido (mesmo nome da API antiga síncrona). */
export async function generatePasswordResetToken(email: string): Promise<string> {
  return issuePasswordResetToken(email);
}
