import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import type { CompanyPlanTier } from '@/lib/company-premium-plans';
import type { BillingPeriod } from '@/lib/billing';
import { getSubscriptionDays } from '@/lib/billing';
import {
  applyCompanySubscriptionBilling,
  type ApplySubscriptionOptions,
} from '@/lib/subscription-billing-storage';
import type { CompanyVerificationInfo, CompanyVerificationStatus } from '@/lib/company/company-verification';
import { isCompanyVerificationStatus } from '@/lib/company/company-verification';
import { isCorporateEmailVerified } from '@/lib/company/corporate-email-confirmation';
import { isCompanyTestBypassUserId } from '@/lib/company/company-test-bypass';

export type CompanyExtraData = {
  cnpj: string | null;
  responsavelNome: string | null;
  responsavelCpf: string | null;
  telefone: string | null;
  endereco: string | null;
  logoUrl: string | null;
  fotoResponsavelUrl: string | null;
  emailCorporativo: string | null;
  emailCorporativoVerificado: boolean;
  cartaoCnpjUrl: string | null;
  verificationStatus: CompanyVerificationStatus;
  verifiedAt: Date | null;
  rejectionReason: string | null;
};

export async function findCompanyByCnpj(
  cnpj: string,
  excludeUserId?: string
): Promise<{ id: string; userId: string } | null> {
  const rows = excludeUserId
    ? await prisma.$queryRaw<Array<{ id: string; userId: string }>>`
        SELECT id, "userId" FROM "Company"
        WHERE cnpj = ${cnpj} AND "userId" != ${excludeUserId}
        LIMIT 1
      `
    : await prisma.$queryRaw<Array<{ id: string; userId: string }>>`
        SELECT id, "userId" FROM "Company"
        WHERE cnpj = ${cnpj}
        LIMIT 1
      `;

  return rows[0] ?? null;
}

export async function findCompanyByResponsavelCpf(
  cpf: string,
  excludeUserId?: string
): Promise<{ id: string; userId: string } | null> {
  const rows = excludeUserId
    ? await prisma.$queryRaw<Array<{ id: string; userId: string }>>`
        SELECT id, "userId" FROM "Company"
        WHERE "responsavelCpf" = ${cpf} AND "userId" != ${excludeUserId}
        LIMIT 1
      `
    : await prisma.$queryRaw<Array<{ id: string; userId: string }>>`
        SELECT id, "userId" FROM "Company"
        WHERE "responsavelCpf" = ${cpf}
        LIMIT 1
      `;

  return rows[0] ?? null;
}

export async function saveCompanyExtraData(
  userId: string,
  data: {
    cnpj?: string;
    responsavelNome?: string;
    responsavelCpf?: string;
    telefone?: string;
    endereco?: string;
    logoUrl?: string;
    fotoResponsavelUrl?: string;
    emailCorporativo?: string;
    emailCorporativoVerificado?: boolean;
    cartaoCnpjUrl?: string;
    verificationStatus?: CompanyVerificationStatus;
    verifiedAt?: Date | null;
    rejectionReason?: string | null;
  }
): Promise<void> {
  if (data.cnpj !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET cnpj = ${data.cnpj}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  if (data.responsavelNome !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET "responsavelNome" = ${data.responsavelNome}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  if (data.responsavelCpf !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET "responsavelCpf" = ${data.responsavelCpf}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  if (data.telefone !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET telefone = ${data.telefone}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  if (data.endereco !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET endereco = ${data.endereco}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  if (data.logoUrl !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET "logoUrl" = ${data.logoUrl}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  if (data.fotoResponsavelUrl !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET "fotoResponsavelUrl" = ${data.fotoResponsavelUrl}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  if (data.emailCorporativo !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET "emailCorporativo" = ${data.emailCorporativo}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  if (data.emailCorporativoVerificado !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET "emailCorporativoVerificado" = ${data.emailCorporativoVerificado}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  if (data.cartaoCnpjUrl !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET "cartaoCnpjUrl" = ${data.cartaoCnpjUrl}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  if (data.verificationStatus !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET "verificationStatus" = ${data.verificationStatus}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  if (data.verifiedAt !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET "verifiedAt" = ${data.verifiedAt}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }

  if (data.rejectionReason !== undefined) {
    await prisma.$executeRaw`
      UPDATE "Company"
      SET "rejectionReason" = ${data.rejectionReason}, "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;
  }
}

export async function getCompanyExtraData(userId: string): Promise<CompanyExtraData> {
  const rows = await prisma.$queryRaw<Array<CompanyExtraData>>`
    SELECT cnpj, "responsavelNome", "responsavelCpf", telefone, endereco,
           "logoUrl", "fotoResponsavelUrl",
           "emailCorporativo", "emailCorporativoVerificado",
           "cartaoCnpjUrl", "verificationStatus", "verifiedAt", "rejectionReason"
    FROM "Company"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;

  if (!rows[0]) {
    return {
      cnpj: null,
      responsavelNome: null,
      responsavelCpf: null,
      telefone: null,
      endereco: null,
      logoUrl: null,
      fotoResponsavelUrl: null,
      emailCorporativo: null,
      emailCorporativoVerificado: false,
      cartaoCnpjUrl: null,
      verificationStatus: 'PENDING',
      verifiedAt: null,
      rejectionReason: null,
    };
  }

  return {
    ...rows[0],
    logoUrl: rows[0].logoUrl ?? null,
    fotoResponsavelUrl: rows[0].fotoResponsavelUrl ?? null,
  };
}

export async function getCompanyVerificationInfo(
  userId: string,
  extras?: CompanyExtraData,
): Promise<CompanyVerificationInfo> {
  const extra = extras ?? (await getCompanyExtraData(userId));

  if (await isCompanyTestBypassUserId(userId)) {
    return {
      verificationStatus: 'VERIFIED',
      verifiedAt: extra.verifiedAt ?? new Date(),
      rejectionReason: null,
      cartaoCnpjUrl: extra.cartaoCnpjUrl,
      emailCorporativo: extra.emailCorporativo,
      emailCorporativoVerificado: true,
      isDocumentVerified: true,
      isEmailVerified: true,
      canAccessSensitiveProfiles: true,
    };
  }

  const status = isCompanyVerificationStatus(extra.verificationStatus)
    ? extra.verificationStatus
    : 'PENDING';

  const isDocumentVerified = !!(
    extra.cartaoCnpjUrl?.trim()
    && status === 'VERIFIED'
  );
  const isEmailVerified = !!(
    extra.emailCorporativo?.trim()
    && extra.emailCorporativoVerificado
  );

  return {
    verificationStatus: status,
    verifiedAt: extra.verifiedAt,
    rejectionReason: extra.rejectionReason,
    cartaoCnpjUrl: extra.cartaoCnpjUrl,
    emailCorporativo: extra.emailCorporativo,
    emailCorporativoVerificado: extra.emailCorporativoVerificado,
    isDocumentVerified,
    isEmailVerified,
    canAccessSensitiveProfiles: isDocumentVerified && isEmailVerified,
  };
}

export async function canCompanyAccessSensitiveProfiles(userId: string): Promise<boolean> {
  const info = await getCompanyVerificationInfo(userId);
  return info.canAccessSensitiveProfiles;
}

/** @deprecated Use canCompanyAccessSensitiveProfiles */
export async function isCompanyVerified(userId: string): Promise<boolean> {
  return canCompanyAccessSensitiveProfiles(userId);
}

export async function getCompanyCnpj(userId: string): Promise<string | null> {
  const data = await getCompanyExtraData(userId);
  return data.cnpj;
}

export async function saveCompanyCnpj(userId: string, cnpj: string): Promise<void> {
  await saveCompanyExtraData(userId, { cnpj });
}

function asCompanyPlanTier(value: unknown): CompanyPlanTier | null {
  const tier = String(value || '').trim().toUpperCase();
  if (tier === 'BASIC' || tier === 'PREMIUM' || tier === 'EMPRESARIAL' || tier === 'FREE') {
    return tier;
  }
  return null;
}

function asExpiryDate(value: unknown): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function getCompanyPlanTier(userId: string): Promise<CompanyPlanTier> {
  if (await isCompanyTestBypassUserId(userId)) {
    return 'EMPRESARIAL';
  }

  let row:
    | {
        planTier: string | null;
        subscriptionExpiresAt: Date | string | null;
        autoRenew?: boolean | null;
      }
    | undefined;

  try {
    const rows = await prisma.$queryRaw<
      Array<{
        planTier: string | null;
        subscriptionExpiresAt: Date | string | null;
        autoRenew: boolean | null;
      }>
    >`
      SELECT "planTier", "subscriptionExpiresAt", "autoRenew"
      FROM "Company"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;
    row = rows[0];
  } catch {
    const rows = await prisma.$queryRaw<
      Array<{ planTier: string | null; subscriptionExpiresAt: Date | string | null }>
    >`
      SELECT "planTier", "subscriptionExpiresAt"
      FROM "Company"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;
    row = rows[0];
  }

  const tier = asCompanyPlanTier(row?.planTier);
  const expiresAt = asExpiryDate(row?.subscriptionExpiresAt);

  if (tier === 'BASIC' || tier === 'PREMIUM' || tier === 'EMPRESARIAL') {
    // Assinatura recorrente: mantém o plano mesmo se a data ainda não foi renovada no banco
    if (row?.autoRenew) {
      return tier;
    }
    // Expirado sem auto-renovação: FREE só na leitura (não grava no GET)
    if (expiresAt && expiresAt.getTime() < Date.now()) {
      return 'FREE';
    }
    return tier;
  }

  // FREE no banco: tenta recuperar se um pagamento pago ainda cobriria o período
  const recovered = await tryRecoverPaidCompanyPlan(userId);
  return recovered || 'FREE';
}

/** Recupera plano pago apagado por downgrade indevido no GET (antes desta correção). */
async function tryRecoverPaidCompanyPlan(userId: string): Promise<CompanyPlanTier | null> {
  try {
    const payments = await prisma.paymentRecord.findMany({
      where: { status: 'PAID' },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { meta: true, createdAt: true },
    });

    for (const payment of payments) {
      const meta = (() => {
        try {
          const parsed = payment.meta ? JSON.parse(payment.meta) : null;
          if (!parsed || parsed.type !== 'company_subscription') return null;
          if (parsed.companyUserId !== userId) return null;
          if (typeof parsed.planTier !== 'string') return null;
          return parsed as { planTier: string; billingPeriod?: string; billingMode?: string };
        } catch {
          return null;
        }
      })();
      if (!meta) continue;

      const paidTier = asCompanyPlanTier(meta.planTier);
      if (!paidTier || paidTier === 'FREE') continue;

      const period = String(meta.billingPeriod || '').toLowerCase() === 'annual' ? 'annual' : 'monthly';
      const days = getSubscriptionDays(period);
      const endsAt = new Date(payment.createdAt.getTime() + days * 24 * 60 * 60 * 1000);
      const recurring = String(meta.billingMode || '').toLowerCase() === 'recurring';

      if (recurring || endsAt.getTime() > Date.now()) {
        await setCompanyPlanTier(userId, paidTier, {
          billingPeriod: period,
          billingMode: recurring ? 'recurring' : 'one_time',
          autoRenew: recurring,
          extendFromCurrent: false,
        });
        return paidTier;
      }
    }
  } catch (error) {
    console.error('[plan] Falha ao recuperar plano pago:', error);
  }
  return null;
}

export async function setCompanyPlanTier(
  userId: string,
  planTier: CompanyPlanTier,
  billing?: ApplySubscriptionOptions & { billingPeriod?: BillingPeriod },
): Promise<void> {
  const period = billing?.billingPeriod ?? 'monthly';
  const days = getSubscriptionDays(period);
  const expiresAt = planTier === 'FREE'
    ? null
    : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await prisma.$executeRaw`
    UPDATE "Company"
    SET "planTier" = ${planTier},
        "subscriptionExpiresAt" = ${expiresAt},
        "updatedAt" = NOW()
    WHERE "userId" = ${userId}
  `;

  if (planTier !== 'FREE' && billing) {
    await applyCompanySubscriptionBilling(userId, {
      ...billing,
      billingPeriod: period,
      extendFromCurrent: billing.extendFromCurrent,
    });
  }
}

export async function countCompanyFavorites(companyUserId: string): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "CompanyFavorite"
    WHERE "companyUserId" = ${companyUserId}
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function listCompanyFavoriteProfileIds(
  companyUserId: string,
  limit = 100
): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ profileId: string }>>`
    SELECT "profileId"
    FROM "CompanyFavorite"
    WHERE "companyUserId" = ${companyUserId}
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => r.profileId);
}

export async function hasCompanyFavorite(
  companyUserId: string,
  profileId: string
): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "CompanyFavorite"
    WHERE "companyUserId" = ${companyUserId} AND "profileId" = ${profileId}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function createCompanyFavorite(
  companyUserId: string,
  profileId: string
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "CompanyFavorite" (id, "companyUserId", "profileId", "createdAt")
    VALUES (${randomUUID()}, ${companyUserId}, ${profileId}, NOW())
    ON CONFLICT ("companyUserId", "profileId") DO NOTHING
  `;
}

export async function deleteCompanyFavorite(
  companyUserId: string,
  profileId: string
): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM "CompanyFavorite"
    WHERE "companyUserId" = ${companyUserId} AND "profileId" = ${profileId}
  `;
}

export type CompanySearchHistoryRow = {
  id: string;
  filtersJSON: string;
  createdAt: Date;
};

export async function listCompanySearchHistory(
  companyUserId: string,
  limit = 10
): Promise<CompanySearchHistoryRow[]> {
  return prisma.$queryRaw<CompanySearchHistoryRow[]>`
    SELECT id, "filtersJSON", "createdAt"
    FROM "CompanySearchHistory"
    WHERE "companyUserId" = ${companyUserId}
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `;
}

export async function createCompanySearchHistory(
  companyUserId: string,
  filtersJSON: string
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "CompanySearchHistory" (id, "companyUserId", "filtersJSON", "createdAt")
    VALUES (${randomUUID()}, ${companyUserId}, ${filtersJSON}, NOW())
  `;
}
