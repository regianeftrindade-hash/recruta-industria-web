import { prisma } from "@/lib/db";

export type ProfileJsonField = "sobreMimJSON" | "testeComportamentalJSON";

async function lerCampoPorSql(
  userId: string,
  field: ProfileJsonField
): Promise<string | null> {
  if (field === "sobreMimJSON") {
    const rows = await prisma.$queryRaw<Array<{ sobreMimJSON: string | null }>>`
      SELECT "sobreMimJSON" FROM "Profile" WHERE "userId" = ${userId} LIMIT 1
    `;
    return rows[0]?.sobreMimJSON ?? null;
  }

  const rows = await prisma.$queryRaw<Array<{ testeComportamentalJSON: string | null }>>`
    SELECT "testeComportamentalJSON" FROM "Profile" WHERE "userId" = ${userId} LIMIT 1
  `;
  return rows[0]?.testeComportamentalJSON ?? null;
}

export async function lerCampoJsonDoPerfil(
  userId: string,
  field: ProfileJsonField
): Promise<string | null> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { sobreMimJSON: true, testeComportamentalJSON: true },
    });
    if (profile) {
      const valor = profile[field];
      if (valor !== undefined && valor !== null) return valor;
    }
  } catch {
    /* Prisma client pode estar desatualizado */
  }

  try {
    return await lerCampoPorSql(userId, field);
  } catch {
    return null;
  }
}

export async function salvarCampoJsonNoPerfil(
  userId: string,
  field: ProfileJsonField,
  json: string
): Promise<void> {
  if (field === "sobreMimJSON") {
    await prisma.$executeRaw`
      UPDATE "Profile" SET "sobreMimJSON" = ${json} WHERE "userId" = ${userId}
    `;
    return;
  }

  await prisma.$executeRaw`
    UPDATE "Profile" SET "testeComportamentalJSON" = ${json} WHERE "userId" = ${userId}
  `;
}
