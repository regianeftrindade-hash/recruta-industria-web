import { prisma } from "@/lib/db";

/** Evita contar cada atualização da mesma página como uma nova visita. */
export const PROFILE_VIEW_REPEAT_MS = 6 * 60 * 60 * 1000;

/** Nome público da empresa. Plano gratuito e visita anônima não recebem identificação. */
export function visibleCompanyName(
  canSeeNames: boolean,
  viewType: string,
  companyName: string | null | undefined,
): string | null {
  if (!canSeeNames || viewType.endsWith("_ANON")) return null;
  const name = companyName?.trim();
  return name || null;
}

export function shouldRecordCompanyProfileView(input: {
  companyUserId: string;
  profileOwnerUserId: string;
  lastViewAt: Date | null;
  now?: Date;
}): boolean {
  if (!input.companyUserId || input.companyUserId === input.profileOwnerUserId) return false;
  const now = input.now ?? new Date();
  if (input.lastViewAt && now.getTime() - input.lastViewAt.getTime() < PROFILE_VIEW_REPEAT_MS) {
    return false;
  }
  return true;
}

export async function recordCompanyProfileView(input: {
  profileId: string;
  profileOwnerUserId: string;
  companyUserId: string;
  viewType: string;
}): Promise<void> {
  const since = new Date(Date.now() - PROFILE_VIEW_REPEAT_MS);
  const recent = await prisma.profileView.findFirst({
    where: {
      profileId: input.profileId,
      companyUserId: input.companyUserId,
      createdAt: { gte: since },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  if (!shouldRecordCompanyProfileView({
    companyUserId: input.companyUserId,
    profileOwnerUserId: input.profileOwnerUserId,
    lastViewAt: recent?.createdAt ?? null,
  })) return;

  await prisma.profileView.create({
    data: {
      profileId: input.profileId,
      companyUserId: input.companyUserId,
      viewType: input.viewType,
    },
  });
}
