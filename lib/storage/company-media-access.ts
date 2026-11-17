import { prisma } from "@/lib/db";
import { resolveCompanyOwnerUserId } from "@/lib/company/company-team";
import { mediaPathMatchesStoredFile } from "@/lib/storage/private-uploads";

const DOCUMENT_KEYS = ["curriculo", "atestado", "certificados", "cnhDocumento"] as const;

function urlsFromProfile(profile: {
  curricoURL: string | null;
  atestadoURL: string | null;
  formDataJSON: string | null;
}): string[] {
  const urls = [profile.curricoURL, profile.atestadoURL].filter((value): value is string => Boolean(value));
  if (!profile.formDataJSON?.trim()) return urls;
  try {
    const data = JSON.parse(profile.formDataJSON) as Record<string, unknown>;
    for (const key of DOCUMENT_KEYS) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) urls.push(value);
    }
  } catch {
    /* JSON antigo inválido não libera arquivo. */
  }
  return urls;
}

/** A empresa só reabre arquivo de perfil que ela desbloqueou. */
export async function companyMayReadUnlockedFile(email: string, requestedPath: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, role: true },
  });
  if (!user || user.role !== "COMPANY") return false;

  const ownerUserId = (await resolveCompanyOwnerUserId(user.id)) || user.id;
  const unlocks = await prisma.accessRecord.findMany({
    where: {
      companyUserId: ownerUserId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    select: { profileId: true },
    take: 500,
  });
  if (unlocks.length === 0) return false;

  const profiles = await prisma.profile.findMany({
    where: { id: { in: unlocks.map((row) => row.profileId) } },
    select: { curricoURL: true, atestadoURL: true, formDataJSON: true },
  });

  return profiles.some((profile) =>
    urlsFromProfile(profile).some((stored) => mediaPathMatchesStoredFile(requestedPath, stored)),
  );
}
