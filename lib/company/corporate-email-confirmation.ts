import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { normalizeCorporateEmail } from '@/lib/company/corporate-email';

const CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

type ConfirmationRow = {
  id: string;
  email: string;
  token: string;
  verified: boolean;
  verifiedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
};

export async function isCorporateEmailVerified(email: string): Promise<boolean> {
  const normalized = normalizeCorporateEmail(email);
  const rows = await prisma.$queryRaw<Array<{ verified: boolean }>>`
    SELECT verified
    FROM "CorporateEmailConfirmation"
    WHERE email = ${normalized} AND verified = true
    ORDER BY "verifiedAt" DESC
    LIMIT 1
  `;
  return !!rows[0]?.verified;
}

export async function createCorporateEmailConfirmation(email: string): Promise<{
  token: string;
  cooldownActive: boolean;
}> {
  const normalized = normalizeCorporateEmail(email);

  const latestRows = await prisma.$queryRaw<Array<ConfirmationRow>>`
    SELECT id, email, token, verified, "verifiedAt", "expiresAt", "createdAt"
    FROM "CorporateEmailConfirmation"
    WHERE email = ${normalized}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  const latest = latestRows[0];

  if (latest && !latest.verified) {
    const createdRecently = latest.createdAt.getTime() + RESEND_COOLDOWN_MS > Date.now();
    if (createdRecently) {
      return { token: latest.token, cooldownActive: true };
    }
  }

  await prisma.$executeRaw`
    DELETE FROM "CorporateEmailConfirmation"
    WHERE email = ${normalized} AND verified = false
  `;

  const token = crypto.randomBytes(32).toString('hex');
  const id = crypto.randomUUID();

  await prisma.$executeRaw`
    INSERT INTO "CorporateEmailConfirmation" (id, email, token, verified, "expiresAt", "createdAt")
    VALUES (${id}, ${normalized}, ${token}, false, ${new Date(Date.now() + CONFIRMATION_TTL_MS)}, NOW())
  `;

  return { token, cooldownActive: false };
}

export async function confirmCorporateEmailByToken(token: string): Promise<{
  ok: boolean;
  email?: string;
  error?: string;
}> {
  const rows = await prisma.$queryRaw<Array<ConfirmationRow>>`
    SELECT id, email, token, verified, "verifiedAt", "expiresAt", "createdAt"
    FROM "CorporateEmailConfirmation"
    WHERE token = ${token}
    LIMIT 1
  `;
  const row = rows[0];

  if (!row) {
    return { ok: false, error: 'Link de confirmação inválido ou já utilizado.' };
  }

  if (row.expiresAt < new Date()) {
    await prisma.$executeRaw`
      DELETE FROM "CorporateEmailConfirmation"
      WHERE id = ${row.id}
    `;
    return { ok: false, error: 'Link de confirmação expirado. Solicite um novo e-mail.' };
  }

  if (!row.verified) {
    await prisma.$executeRaw`
      UPDATE "CorporateEmailConfirmation"
      SET verified = true, "verifiedAt" = NOW()
      WHERE id = ${row.id}
    `;
  }

  return { ok: true, email: row.email };
}

export async function assertCorporateEmailVerified(email: string): Promise<string | null> {
  const normalized = normalizeCorporateEmail(email);
  const verified = await isCorporateEmailVerified(normalized);
  if (!verified) {
    return 'Confirme o e-mail corporativo pelo link enviado antes de finalizar o cadastro.';
  }
  return null;
}
