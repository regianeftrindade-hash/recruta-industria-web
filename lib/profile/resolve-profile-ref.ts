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

/** Garante a coluna no Postgres mesmo se o migrate ainda não rodou. */
export async function ensurePublicSlugColumn(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "publicSlug" TEXT`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "Profile_publicSlug_key" ON "Profile"("publicSlug")`,
    );
  } catch (err) {
    console.warn("[ensurePublicSlugColumn]", err);
  }
}

/** Garante publicSlug no banco; idempotente. Nunca propaga erro. */
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
    await ensurePublicSlugColumn();
    await prisma.profile.update({
      where: { id: profile.id },
      data: { publicSlug: desired },
    });
    return desired;
  } catch {
    try {
      const alt = `${desired}-${Date.now().toString(36).slice(-3)}`;
      await prisma.profile.update({
        where: { id: profile.id },
        data: { publicSlug: alt },
      });
      return alt;
    } catch {
      return desired;
    }
  }
}

function slugSuffix(ref: string): string | null {
  const m = String(ref).trim().match(/-([a-z0-9]{6})$/i);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Resolve parâmetro de URL (slug ou id interno) → id do Profile.
 * Aceita slug só calculado (ainda não gravado) via sufixo dos 6 últimos chars do cuid.
 */
export async function resolveProfileIdFromParam(param: string): Promise<string | null> {
  const ref = decodeURIComponent(String(param || "").trim());
  if (!ref) return null;

  await ensurePublicSlugColumn();

  try {
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
  } catch (err) {
    console.warn("[resolveProfileIdFromParam] bySlug", err);
  }

  try {
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
    if (byId) {
      await ensureProfilePublicSlug(byId);
      return byId.id;
    }
  } catch (err) {
    console.warn("[resolveProfileIdFromParam] byId", err);
  }

  // Slug da vitrine pode ainda não estar no banco — casa pelo sufixo do id.
  const suffix = slugSuffix(ref);
  if (suffix) {
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM "Profile" WHERE id LIKE $1 LIMIT 8`,
        `%${suffix}`,
      );
      if (rows.length === 1) {
        const profile = await prisma.profile.findUnique({
          where: { id: rows[0].id },
          select: {
            id: true,
            publicSlug: true,
            title: true,
            cargoDesejado: true,
            cidade: true,
            estado: true,
          },
        });
        if (profile) {
          await ensureProfilePublicSlug(profile);
          return profile.id;
        }
        return rows[0].id;
      }
      // Vários candidatos: preferir o que gera o mesmo slug.
      for (const row of rows) {
        const profile = await prisma.profile.findUnique({
          where: { id: row.id },
          select: {
            id: true,
            publicSlug: true,
            title: true,
            cargoDesejado: true,
            cidade: true,
            estado: true,
          },
        });
        if (!profile) continue;
        const built = profilePublicSlugOrBuild(profile);
        if (built === ref || profile.publicSlug === ref) {
          await ensureProfilePublicSlug(profile);
          return profile.id;
        }
      }
    } catch (err) {
      console.warn("[resolveProfileIdFromParam] bySuffix", err);
    }
  }

  return null;
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
