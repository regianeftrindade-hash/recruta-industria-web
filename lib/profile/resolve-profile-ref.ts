import { prisma } from "@/lib/db";
import { buildProfilePublicSlug } from "@/lib/profile/public-slug";

type ProfileSlugSource = {
  id: string;
  publicSlug?: string | null;
  title?: string | null;
  cargoDesejado?: string | null;
  cidade?: string | null;
  estado?: string | null;
};

/** Garante publicSlug no banco; idempotente. */
export async function ensureProfilePublicSlug(profile: ProfileSlugSource): Promise<string> {
  if (profile.publicSlug?.trim()) return profile.publicSlug.trim();

  const desired = buildProfilePublicSlug({
    id: profile.id,
    title: profile.title,
    cargo: profile.cargoDesejado,
    city: profile.cidade,
    state: profile.estado,
  });

  try {
    await prisma.profile.update({
      where: { id: profile.id },
      data: { publicSlug: desired },
    });
    return desired;
  } catch {
    const alt = `${desired}-${Date.now().toString(36).slice(-3)}`;
    await prisma.profile.update({
      where: { id: profile.id },
      data: { publicSlug: alt },
    });
    return alt;
  }
}

/**
 * Resolve parâmetro de URL (slug ou id interno) → id do Profile.
 * Preenche publicSlug se ainda não existir.
 */
export async function resolveProfileIdFromParam(param: string): Promise<string | null> {
  const ref = decodeURIComponent(String(param || "").trim());
  if (!ref) return null;

  const bySlug = await prisma.profile.findFirst({
    where: { publicSlug: ref },
    select: {
      id: true,
      publicSlug: true,
      title: true,
      cargoDesejado: true,
      cidade: true,
      estado: true,
    },
  });
  if (bySlug) {
    await ensureProfilePublicSlug(bySlug);
    return bySlug.id;
  }

  const byId = await prisma.profile.findUnique({
    where: { id: ref },
    select: {
      id: true,
      publicSlug: true,
      title: true,
      cargoDesejado: true,
      cidade: true,
      estado: true,
    },
  });
  if (!byId) return null;

  await ensureProfilePublicSlug(byId);
  return byId.id;
}

/** Slug para links (usa o salvo ou calcula sem gravar). */
export function profilePublicSlugOrBuild(profile: ProfileSlugSource): string {
  if (profile.publicSlug?.trim()) return profile.publicSlug.trim();
  return buildProfilePublicSlug({
    id: profile.id,
    title: profile.title,
    cargo: profile.cargoDesejado,
    city: profile.cidade,
    state: profile.estado,
  });
}
