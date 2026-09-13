import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { matchesCompanyTestBypass } from '@/lib/company/company-test-bypass-shared';

/** Limpeza do painel: só conta visitas/cadastros/pagamentos a partir desta data (BRT 13/09/2026 00:00). */
export const ADMIN_STATS_BASELINE_DEFAULT = '2026-09-13T03:00:00.000Z';

function splitEmails(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((item) => item.toLowerCase().trim())
    .filter(Boolean);
}

/**
 * Data de corte das métricas do /admin.
 * - padrão: zera histórico de teste até 13/09/2026
 * - ADMIN_STATS_SINCE=ISO → usa essa data
 * - ADMIN_STATS_SINCE=off → conta tudo (só exclui contas teste)
 */
export function getAdminStatsBaselineAt(): Date {
  const raw = process.env.ADMIN_STATS_SINCE?.trim().toLowerCase();
  if (raw === 'off' || raw === '0' || raw === 'false') {
    return new Date(0);
  }
  const fromEnv = process.env.ADMIN_STATS_SINCE?.trim();
  if (fromEnv) {
    const parsed = new Date(fromEnv);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(ADMIN_STATS_BASELINE_DEFAULT);
}

/** E-mails exatos a excluir do painel admin (E2E + lista explícita). */
export function getAdminExactTestEmails(): string[] {
  return [...new Set([
    ...splitEmails(process.env.E2E_COMPANY_EMAIL),
    ...splitEmails(process.env.E2E_PROFESSIONAL_EMAIL),
    ...splitEmails(process.env.ADMIN_EXCLUDE_TEST_EMAILS),
  ])];
}

/** Conta de teste (bypass empresa, E2E ou lista ADMIN_EXCLUDE_TEST_EMAILS). */
export function isAdminExcludedTestAccount(params: {
  email?: string | null;
  companyName?: string | null;
  userName?: string | null;
}): boolean {
  if (matchesCompanyTestBypass(params)) return true;
  const email = params.email?.toLowerCase().trim() || '';
  if (!email) return false;
  return getAdminExactTestEmails().includes(email);
}

export type AdminExcludedTestAccounts = {
  userIds: string[];
  emails: string[];
};

/** Resolve IDs/e-mails de contas teste para filtrar métricas e listas do admin. */
export async function getAdminExcludedTestAccounts(): Promise<AdminExcludedTestAccounts> {
  const exactEmails = getAdminExactTestEmails();

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { role: { in: ['COMPANY', 'PROFESSIONAL'] } },
        ...(exactEmails.length
          ? [{ email: { in: exactEmails, mode: 'insensitive' as const } }]
          : []),
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      company: { select: { name: true } },
    },
  });

  const excluded = users.filter((user) =>
    isAdminExcludedTestAccount({
      email: user.email,
      userName: user.name,
      companyName: user.company?.name,
    }),
  );

  return {
    userIds: excluded.map((user) => user.id),
    emails: [...new Set(excluded.map((user) => user.email.toLowerCase().trim()))],
  };
}

/** Fragmento SQL: AND col NOT IN (...). Vazio se não houver IDs. */
export function sqlAndUserIdNotIn(columnSql: Prisma.Sql, userIds: string[]): Prisma.Sql {
  if (userIds.length === 0) return Prisma.sql``;
  return Prisma.sql`AND ${columnSql} NOT IN (${Prisma.join(userIds)})`;
}

/** Soma pagamentos PAID ignorando customer.email de contas teste e opcionalmente antes do baseline. */
export function sumPaidExcludingTestEmails(
  payments: Array<{ amount: number; customer: string | null; createdAt?: Date | string | null }>,
  excludedEmails: string[],
  baselineAt?: Date,
): { collectedCentavos: number; collectedPayments: number } {
  const emailSet = new Set(excludedEmails.map((e) => e.toLowerCase()));
  const baselineMs = baselineAt?.getTime() ?? 0;
  let collectedCentavos = 0;
  let collectedPayments = 0;

  for (const payment of payments) {
    if (baselineMs > 0 && payment.createdAt) {
      const createdMs = new Date(payment.createdAt).getTime();
      if (!Number.isNaN(createdMs) && createdMs < baselineMs) continue;
    }
    let email = '';
    if (payment.customer) {
      try {
        const parsed = JSON.parse(payment.customer) as { email?: string };
        email = String(parsed?.email || '').toLowerCase().trim();
      } catch {
        email = '';
      }
    }
    if (email && (emailSet.has(email) || isAdminExcludedTestAccount({ email }))) {
      continue;
    }
    collectedCentavos += Math.round(Number(payment.amount || 0));
    collectedPayments += 1;
  }

  return { collectedCentavos, collectedPayments };
}
