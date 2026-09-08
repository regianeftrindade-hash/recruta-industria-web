import { buildProfilePublicSlug } from "@/lib/profile/public-slug";

type ProfileSlugSource = {
  id: string;
  publicSlug?: string | null;
  title?: string | null;
  cargoDesejado?: string | null;
  cidade?: string | null;
  estado?: string | null;
};

/** No-op: slug deixa de depender de coluna no banco (evita quebrar o Prisma). */
export async function ensurePublicSlugColumn(): Promise<void> {
  /* coluna opcional — não usada pelo Prisma Client */
}

/** Só calcula o slug; não grava no banco. */
export async function ensureProfilePublicSlug(profile: ProfileSlugSource): Promise<string> {
  return profilePublicSlugOrBuild(profile);
}

/**
 * Resolve parâmetro de URL → id.
 * Com a rota /company/professional/[id] o param já é o cuid.
 */
export async function resolveProfileIdFromParam(param: string): Promise<string | null> {
  const ref = decodeURIComponent(String(param || "").trim());
  if (!ref) return null;
  if (/^c[a-z0-9]{20,}$/i.test(ref)) return ref;
  return null;
}

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
