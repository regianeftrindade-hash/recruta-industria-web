import { prisma } from '@/lib/db';
import { ensureVideoApresentacaoColumn } from '@/lib/ensure-db-schema';

export async function getVideoApresentacaoPath(userId: string): Promise<string | null> {
  await ensureVideoApresentacaoColumn();

  const rows = await prisma.$queryRaw<Array<{ videoApresentacaoPath: string | null }>>`
    SELECT "videoApresentacaoPath" FROM "Profile" WHERE "userId" = ${userId} LIMIT 1
  `;
  return rows[0]?.videoApresentacaoPath ?? null;
}

export async function setVideoApresentacaoPath(
  userId: string,
  path: string | null,
): Promise<boolean> {
  await ensureVideoApresentacaoColumn();

  const updated = await prisma.$executeRaw`
    UPDATE "Profile" SET "videoApresentacaoPath" = ${path} WHERE "userId" = ${userId}
  `;

  return Number(updated) > 0;
}

export async function getVideoApresentacaoPathByProfileId(
  profileId: string,
): Promise<string | null> {
  await ensureVideoApresentacaoColumn();

  const rows = await prisma.$queryRaw<Array<{ videoApresentacaoPath: string | null }>>`
    SELECT "videoApresentacaoPath" FROM "Profile" WHERE "id" = ${profileId} LIMIT 1
  `;
  return rows[0]?.videoApresentacaoPath ?? null;
}
