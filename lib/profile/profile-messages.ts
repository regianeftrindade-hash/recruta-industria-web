import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { ensureProfileMessageTable } from '@/lib/ensure-db-schema';

export const LIMITE_MENSAGENS_PROFISSIONAL = 10;

export interface MensagemPerfilDTO {
  id: string;
  from: string;
  body: string;
  createdAt: string;
}

type MensagemRow = {
  id: string;
  companyName: string;
  body: string;
  createdAt: Date;
};

async function countMensagens(profileId: string): Promise<number> {
  await ensureProfileMessageTable();
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "ProfileMessage"
    WHERE "profileId" = ${profileId}
  `;
  return Number(rows[0]?.count ?? 0);
}

async function limparMensagens(profileId: string): Promise<void> {
  await ensureProfileMessageTable();
  await prisma.$executeRaw`
    DELETE FROM "ProfileMessage"
    WHERE "profileId" = ${profileId}
  `;
}

async function listarMensagensRaw(profileId: string): Promise<MensagemRow[]> {
  await ensureProfileMessageTable();
  return prisma.$queryRaw<MensagemRow[]>`
    SELECT id, "companyName", body, "createdAt"
    FROM "ProfileMessage"
    WHERE "profileId" = ${profileId}
    ORDER BY "createdAt" DESC
  `;
}

export async function listarMensagensDoPerfil(profileId: string): Promise<MensagemPerfilDTO[]> {
  const mensagens = await listarMensagensRaw(profileId);

  if (mensagens.length > LIMITE_MENSAGENS_PROFISSIONAL) {
    await limparMensagens(profileId);
    return [];
  }

  return mensagens.map((msg) => ({
    id: msg.id,
    from: msg.companyName || 'Empresa',
    body: msg.body,
    createdAt: msg.createdAt.toISOString(),
  }));
}

export async function enviarMensagemParaPerfil(
  companyUserId: string,
  companyName: string,
  profileId: string,
  body: string,
) {
  await ensureProfileMessageTable();

  const total = await countMensagens(profileId);
  if (total >= LIMITE_MENSAGENS_PROFISSIONAL) {
    await limparMensagens(profileId);
  }

  const id = randomUUID();
  const texto = body.trim();
  const agora = new Date();

  await prisma.$executeRaw`
    INSERT INTO "ProfileMessage" (id, "profileId", "companyUserId", "companyName", body, "createdAt")
    VALUES (${id}, ${profileId}, ${companyUserId}, ${companyName}, ${texto}, ${agora})
  `;

  return {
    id,
    profileId,
    companyUserId,
    companyName,
    body: texto,
    createdAt: agora,
  };
}

export async function excluirMensagemDoPerfil(profileId: string, messageId: string): Promise<boolean> {
  await ensureProfileMessageTable();
  const result = await prisma.$executeRaw`
    DELETE FROM "ProfileMessage"
    WHERE id = ${messageId} AND "profileId" = ${profileId}
  `;
  return Number(result) > 0;
}

export async function countMensagensDoPerfil(profileId: string): Promise<number> {
  return countMensagens(profileId);
}

export async function listarPerfisVisualizados(companyUserId: string): Promise<Set<string>> {
  const views = await prisma.profileView.findMany({
    where: {
      companyUserId,
      viewType: 'FULL',
    },
    select: { profileId: true },
    distinct: ['profileId'],
  });
  return new Set(views.map((v) => v.profileId));
}
