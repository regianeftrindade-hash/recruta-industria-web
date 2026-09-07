import { prisma } from "@/lib/db";
import { getPlanFeatures } from "@/lib/company/company-plan";
import { getCompanyPlanTier } from "@/lib/company-storage";

/** Pacotes de usuários RH extras (acima do limite do plano). */
export const COMPANY_EXTRA_SEAT_PACKAGES = [
  {
    id: "pack1",
    quantity: 1,
    priceCentavos: 2990,
    priceLabel: "R$ 29,90",
    title: "1 usuário extra",
    emoji: "👤",
  },
  {
    id: "pack3",
    quantity: 3,
    priceCentavos: 7990,
    priceLabel: "R$ 79,90",
    title: "3 usuários extras",
    emoji: "👥",
  },
  {
    id: "pack5",
    quantity: 5,
    priceCentavos: 11990,
    priceLabel: "R$ 119,90",
    title: "5 usuários extras",
    emoji: "👥👥",
  },
] as const;

export type ExtraSeatPackageId = (typeof COMPANY_EXTRA_SEAT_PACKAGES)[number]["id"];

/** Compatibilidade: preço unitário do pacote de 1 usuário. */
export const COMPANY_EXTRA_SEAT = {
  priceCentavos: COMPANY_EXTRA_SEAT_PACKAGES[0].priceCentavos,
  priceLabel: COMPANY_EXTRA_SEAT_PACKAGES[0].priceLabel,
  period: "/mês",
  maxPurchasable: 20,
} as const;

let extraSeatsColumnReady = false;

async function companyHasColumn(columnName: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Company'
        AND column_name = ${columnName}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

export async function ensureCompanyExtraSeatsColumn(): Promise<void> {
  if (extraSeatsColumnReady) return;
  const has = await companyHasColumn("extraSeats");
  if (!has) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Company" ADD COLUMN "extraSeats" INTEGER NOT NULL DEFAULT 0`,
    );
  }
  extraSeatsColumnReady = true;
}

/** Assentos inclusos no plano (Admin conta como 1). */
export function getIncludedSeatsForTier(tier: string): number {
  return getPlanFeatures(tier as "FREE" | "BASIC" | "PREMIUM" | "EMPRESARIAL").maxUsers ?? 1;
}

export function getExtraSeatPackage(
  packageIdOrQuantity: string | number,
): (typeof COMPANY_EXTRA_SEAT_PACKAGES)[number] | null {
  if (typeof packageIdOrQuantity === "number" || /^\d+$/.test(String(packageIdOrQuantity))) {
    const qty = Math.floor(Number(packageIdOrQuantity));
    return COMPANY_EXTRA_SEAT_PACKAGES.find((p) => p.quantity === qty) ?? null;
  }
  return COMPANY_EXTRA_SEAT_PACKAGES.find((p) => p.id === packageIdOrQuantity) ?? null;
}

export async function getCompanyExtraSeats(ownerUserId: string): Promise<number> {
  await ensureCompanyExtraSeatsColumn();
  const rows = await prisma.$queryRaw<Array<{ extraSeats: number | null }>>`
    SELECT "extraSeats" FROM "Company" WHERE "userId" = ${ownerUserId} LIMIT 1
  `;
  const n = Number(rows[0]?.extraSeats ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Limite total = incluso no plano + usuários extras comprados. */
export async function getEffectiveMaxUsers(ownerUserId: string): Promise<{
  planTier: string;
  includedSeats: number;
  extraSeats: number;
  maxUsers: number;
}> {
  const planTier = await getCompanyPlanTier(ownerUserId);
  const includedSeats = getIncludedSeatsForTier(planTier);
  const extraSeats = await getCompanyExtraSeats(ownerUserId);
  return {
    planTier,
    includedSeats,
    extraSeats,
    maxUsers: includedSeats + extraSeats,
  };
}

export async function addCompanyExtraSeats(
  ownerUserId: string,
  quantity: number,
): Promise<number> {
  await ensureCompanyExtraSeatsColumn();
  const qty = Math.max(1, Math.floor(quantity));
  const current = await getCompanyExtraSeats(ownerUserId);
  const next = Math.min(COMPANY_EXTRA_SEAT.maxPurchasable, current + qty);
  await prisma.$executeRaw`
    UPDATE "Company"
    SET "extraSeats" = ${next},
        "updatedAt" = NOW()
    WHERE "userId" = ${ownerUserId}
  `;
  return next;
}

/** Valor do pacote (1, 3 ou 5). Quantidades fora dos pacotes não são aceitas. */
export function calcExtraSeatsAmountCentavos(quantity: number): number {
  const pack = getExtraSeatPackage(quantity);
  if (!pack) {
    throw new Error("INVALID_PACKAGE");
  }
  return pack.priceCentavos;
}
