import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { matchesCompanyTestBypass } from '@/lib/company/company-test-bypass-shared';

function splitEmails(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((item) => item.toLowerCase().trim())
    .filter(Boolean);
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

/** Soma pagamentos PAID ignorando customer.email de contas teste. */
export function sumPaidExcludingTestEmails(
  payments: Array<{ amount: number; customer: string | null }>,
  excludedEmails: string[],
): { collectedCentavos: number; collectedPayments: number } {
  const emailSet = new Set(excludedEmails.map((e) => e.toLowerCase()));
  let collectedCentavos = 0;
  let collectedPayments = 0;

  for (const payment of payments) {
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
