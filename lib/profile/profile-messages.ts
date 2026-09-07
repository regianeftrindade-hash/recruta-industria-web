import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { ensureProfileMessageTable } from '@/lib/ensure-db-schema';
import { limparMensagensExpiradas } from '@/lib/profile/inbox-cleanup';

export type MessageSenderRole = 'COMPANY' | 'PROFESSIONAL';

export interface MensagemPerfilDTO {
  id: string;
  from: string;
  body: string;
  createdAt: string;
  senderRole: MessageSenderRole;
  replyToId: string | null;
  companyUserId: string;
  companyName: string;
  /** Respostas do profissional a esta mensagem (quando listamos lado empresa→candidato) */
  replies?: MensagemPerfilDTO[];
}

type MensagemRow = {
  id: string;
  companyUserId: string;
  companyName: string;
  body: string;
  createdAt: Date;
  senderRole: string | null;
  replyToId: string | null;
};

function normalizeRole(role: string | null | undefined): MessageSenderRole {
  return role === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'COMPANY';
}

function mapRow(msg: MensagemRow): MensagemPerfilDTO {
  const senderRole = normalizeRole(msg.senderRole);
  return {
    id: msg.id,
    from: senderRole === 'PROFESSIONAL' ? 'Você' : (msg.companyName || 'Empresa'),
    body: msg.body,
    createdAt: msg.createdAt.toISOString(),
    senderRole,
    replyToId: msg.replyToId,
    companyUserId: msg.companyUserId,
    companyName: msg.companyName || 'Empresa',
  };
}

async function listarMensagensRaw(profileId: string): Promise<MensagemRow[]> {
  await ensureProfileMessageTable();
  return prisma.$queryRaw<MensagemRow[]>`
    SELECT id, "companyUserId", "companyName", body, "createdAt",
           COALESCE("senderRole", 'COMPANY') AS "senderRole",
           "replyToId"
    FROM "ProfileMessage"
    WHERE "profileId" = ${profileId}
    ORDER BY "createdAt" ASC
  `;
}

/** Lista mensagens do profissional agrupando respostas sob a mensagem da empresa. */
export async function listarMensagensDoPerfil(profileId: string): Promise<MensagemPerfilDTO[]> {
  await limparMensagensExpiradas(profileId);
  const mensagens = await listarMensagensRaw(profileId);
  const mapped = mensagens.map(mapRow);

  const byId = new Map(mapped.map((m) => [m.id, { ...m, replies: [] as MensagemPerfilDTO[] }]));
  const roots: MensagemPerfilDTO[] = [];

  for (const msg of mapped) {
    const node = byId.get(msg.id)!;
    if (msg.senderRole === 'PROFESSIONAL' && msg.replyToId && byId.has(msg.replyToId)) {
      byId.get(msg.replyToId)!.replies = byId.get(msg.replyToId)!.replies || [];
      byId.get(msg.replyToId)!.replies!.push(node);
    } else if (msg.senderRole === 'COMPANY') {
      roots.push(node);
    } else {
      // Resposta órfã ou legado — mostra como item próprio
      roots.push(node);
    }
  }

  // Mais recentes primeiro na caixa do profissional
  return roots.reverse();
}

export async function enviarMensagemParaPerfil(
  companyUserId: string,
  companyName: string,
  profileId: string,
  body: string,
) {
  await ensureProfileMessageTable();
  await limparMensagensExpiradas(profileId);

  const id = randomUUID();
  const texto = body.trim();
  const agora = new Date();

  await prisma.$executeRaw`
    INSERT INTO "ProfileMessage" (id, "profileId", "companyUserId", "companyName", body, "createdAt", "senderRole", "replyToId")
    VALUES (${id}, ${profileId}, ${companyUserId}, ${companyName}, ${texto}, ${agora}, ${'COMPANY'}, ${null})
  `;

  return {
    id,
    profileId,
    companyUserId,
    companyName,
    body: texto,
    createdAt: agora,
    senderRole: 'COMPANY' as const,
  };
}

/** Profissional responde a uma mensagem da empresa. */
export async function responderMensagemDaEmpresa(params: {
  profileId: string;
  professionalName: string;
  replyToId: string;
  body: string;
}) {
  await ensureProfileMessageTable();

  const original = await prisma.$queryRaw<
    Array<{
      id: string;
      profileId: string;
      companyUserId: string;
      companyName: string;
      senderRole: string | null;
    }>
  >`
    SELECT id, "profileId", "companyUserId", "companyName",
           COALESCE("senderRole", 'COMPANY') AS "senderRole"
    FROM "ProfileMessage"
    WHERE id = ${params.replyToId} AND "profileId" = ${params.profileId}
    LIMIT 1
  `;

  const parent = original[0];
  if (!parent) {
    throw new Error('Mensagem original não encontrada');
  }
  if (normalizeRole(parent.senderRole) !== 'COMPANY') {
    throw new Error('Só é possível responder mensagens da empresa');
  }

  const id = randomUUID();
  const texto = params.body.trim();
  const agora = new Date();
  const fromLabel = params.professionalName.trim() || 'Profissional';

  await prisma.$executeRaw`
    INSERT INTO "ProfileMessage" (id, "profileId", "companyUserId", "companyName", body, "createdAt", "senderRole", "replyToId")
    VALUES (
      ${id},
      ${params.profileId},
      ${parent.companyUserId},
      ${fromLabel},
      ${texto},
      ${agora},
      ${'PROFESSIONAL'},
      ${params.replyToId}
    )
  `;

  return {
    id,
    profileId: params.profileId,
    companyUserId: parent.companyUserId,
    companyName: parent.companyName,
    professionalName: fromLabel,
    body: texto,
    createdAt: agora,
    replyToId: params.replyToId,
    senderRole: 'PROFESSIONAL' as const,
  };
}

/** Mensagens/respostas recebidas pela empresa (de profissionais). */
export async function listarRespostasParaEmpresa(companyUserId: string): Promise<MensagemPerfilDTO[]> {
  await ensureProfileMessageTable();
  const rows = await prisma.$queryRaw<MensagemRow[]>`
    SELECT id, "companyUserId", "companyName", body, "createdAt",
           COALESCE("senderRole", 'COMPANY') AS "senderRole",
           "replyToId"
    FROM "ProfileMessage"
    WHERE "companyUserId" = ${companyUserId}
      AND COALESCE("senderRole", 'COMPANY') = 'PROFESSIONAL'
    ORDER BY "createdAt" DESC
    LIMIT 100
  `;
  return rows.map(mapRow);
}

/** Thread de um perfil para a empresa (mensagens enviadas + respostas). */
export async function listarThreadEmpresaPerfil(
  companyUserId: string,
  profileId: string,
): Promise<MensagemPerfilDTO[]> {
  await ensureProfileMessageTable();
  const rows = await prisma.$queryRaw<MensagemRow[]>`
    SELECT id, "companyUserId", "companyName", body, "createdAt",
           COALESCE("senderRole", 'COMPANY') AS "senderRole",
           "replyToId"
    FROM "ProfileMessage"
    WHERE "companyUserId" = ${companyUserId} AND "profileId" = ${profileId}
    ORDER BY "createdAt" ASC
  `;
  return rows.map((msg) => {
    const dto = mapRow(msg);
    if (dto.senderRole === 'PROFESSIONAL') {
      dto.from = msg.companyName || 'Profissional';
    } else {
      dto.from = 'Você (empresa)';
    }
    return dto;
  });
}

export async function excluirMensagemDoPerfil(profileId: string, messageId: string): Promise<boolean> {
  await ensureProfileMessageTable();
  // Apaga respostas filhas primeiro
  await prisma.$executeRaw`
    DELETE FROM "ProfileMessage"
    WHERE "replyToId" = ${messageId} AND "profileId" = ${profileId}
  `;
  const result = await prisma.$executeRaw`
    DELETE FROM "ProfileMessage"
    WHERE id = ${messageId} AND "profileId" = ${profileId}
  `;
  return Number(result) > 0;
}

/** Empresa exclui uma mensagem da thread com o profissional. */
export async function excluirMensagemDaEmpresa(
  companyUserId: string,
  profileId: string,
  messageId: string,
): Promise<boolean> {
  await ensureProfileMessageTable();
  await prisma.$executeRaw`
    DELETE FROM "ProfileMessage"
    WHERE "replyToId" = ${messageId}
      AND "profileId" = ${profileId}
      AND "companyUserId" = ${companyUserId}
  `;
  const result = await prisma.$executeRaw`
    DELETE FROM "ProfileMessage"
    WHERE id = ${messageId}
      AND "profileId" = ${profileId}
      AND "companyUserId" = ${companyUserId}
  `;
  return Number(result) > 0;
}

export async function countMensagensDoPerfil(profileId: string): Promise<number> {
  await ensureProfileMessageTable();
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "ProfileMessage"
    WHERE "profileId" = ${profileId}
      AND COALESCE("senderRole", 'COMPANY') = 'COMPANY'
  `;
  return Number(rows[0]?.count ?? 0);
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
