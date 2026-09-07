import { prisma } from '@/lib/db';
import { ensureProfileMessageTable } from '@/lib/ensure-db-schema';
import { limiteRetencaoInbox } from '@/lib/profile/inbox-retention';

export async function limparMensagensExpiradas(profileId: string): Promise<void> {
  await ensureProfileMessageTable();
  const limite = limiteRetencaoInbox();
  await prisma.$executeRaw`
    DELETE FROM "ProfileMessage"
    WHERE "profileId" = ${profileId} AND "createdAt" < ${limite}
  `;
}

export async function limparDicasExpiradas(profileId: string): Promise<void> {
  const limite = limiteRetencaoInbox();
  await prisma.tip.deleteMany({
    where: {
      profileId,
      createdAt: { lt: limite },
    },
  });
}
