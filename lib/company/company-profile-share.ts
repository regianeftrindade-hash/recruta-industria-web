import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import {
  getCompanySubscriptionKey,
  listActiveTeamPeers,
  resolveCompanyActor,
} from "@/lib/company/company-team";

export type ProfileShareDTO = {
  id: string;
  profileId: string;
  professionalName: string;
  cargo: string | null;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  note: string | null;
  createdAt: string;
  readAt: string | null;
};

type ShareRow = {
  id: string;
  companyOwnerUserId: string;
  fromUserId: string;
  toUserId: string;
  profileId: string;
  note: string | null;
  createdAt: Date;
  readAt: Date | null;
};

let shareTableReady = false;

export async function ensureCompanyProfileShareTable(): Promise<void> {
  if (shareTableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyProfileShare" (
      "id" TEXT NOT NULL,
      "companyOwnerUserId" TEXT NOT NULL,
      "fromUserId" TEXT NOT NULL,
      "toUserId" TEXT NOT NULL,
      "profileId" TEXT NOT NULL,
      "note" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "readAt" TIMESTAMP(3),
      CONSTRAINT "CompanyProfileShare_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CompanyProfileShare_toUserId_createdAt_idx" ON "CompanyProfileShare"("toUserId", "createdAt")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CompanyProfileShare_owner_profile_idx" ON "CompanyProfileShare"("companyOwnerUserId", "profileId")`,
  );
  shareTableReady = true;
}

async function ensureChatTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyChatMessage" (
      "id" TEXT NOT NULL,
      "companyKey" TEXT NOT NULL,
      "authorUserId" TEXT NOT NULL,
      "authorName" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompanyChatMessage_pkey" PRIMARY KEY ("id")
    )
  `);
}

/** Compartilha um perfil com colegas da mesma assinatura/plano. */
export async function shareProfileWithTeam(input: {
  actorUserId: string;
  profileId: string;
  toUserIds: string[];
  note?: string;
  origin: string;
}): Promise<{ shared: number; skipped: number }> {
  await ensureCompanyProfileShareTable();

  const actor = await resolveCompanyActor(input.actorUserId);
  if (!actor) throw new Error("FORBIDDEN");

  const peers = await listActiveTeamPeers(input.actorUserId);
  const peerById = new Map(peers.map((p) => [p.id, p]));

  const profile = await prisma.profile.findUnique({
    where: { id: input.profileId },
    include: { user: { select: { name: true } } },
  });
  if (!profile) throw new Error("PROFILE_NOT_FOUND");

  const fromUser = await prisma.user.findUnique({
    where: { id: input.actorUserId },
    include: { company: true },
  });
  const fromName =
    fromUser?.company?.responsavelNome || fromUser?.name || fromUser?.email || "Colega do RH";

  const uniqueTargets = [...new Set(input.toUserIds.map((id) => String(id).trim()).filter(Boolean))];
  if (uniqueTargets.length === 0) throw new Error("NO_TARGETS");

  let shared = 0;
  let skipped = 0;
  const note = input.note?.trim().slice(0, 280) || null;
  const professionalName = profile.user?.name || "Profissional";
  const cargo =
    (profile as { cargoDesejado?: string | null }).cargoDesejado || profile.title || "";
  const profileUrl = `${input.origin.replace(/\/$/, "")}/company/professional/${profile.id}`;

  await ensureChatTable();
  const companyKey = getCompanySubscriptionKey(actor.ownerUserId);

  for (const toUserId of uniqueTargets) {
    if (toUserId === input.actorUserId) {
      skipped += 1;
      continue;
    }
    if (!peerById.has(toUserId)) {
      skipped += 1;
      continue;
    }

    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "CompanyProfileShare" (
        id, "companyOwnerUserId", "fromUserId", "toUserId", "profileId", note, "createdAt"
      ) VALUES (
        ${id}, ${actor.ownerUserId}, ${input.actorUserId}, ${toUserId}, ${profile.id}, ${note}, NOW()
      )
    `;

    const peer = peerById.get(toUserId)!;
    const chatBody = [
      `📎 ${fromName} compartilhou o perfil de ${professionalName}${cargo ? ` (${cargo})` : ""} com ${peer.name}.`,
      note ? `Nota: ${note}` : null,
      `Abrir: ${profileUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    const chatId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "CompanyChatMessage" (
        id, "companyKey", "authorUserId", "authorName", body, "createdAt"
      ) VALUES (
        ${chatId}, ${companyKey}, ${input.actorUserId}, ${fromName}, ${chatBody}, NOW()
      )
    `;

    shared += 1;
  }

  if (shared === 0) throw new Error("NO_VALID_TARGETS");
  return { shared, skipped };
}

export async function listReceivedProfileShares(userId: string): Promise<ProfileShareDTO[]> {
  await ensureCompanyProfileShareTable();

  const rows = await prisma.$queryRaw<ShareRow[]>`
    SELECT * FROM "CompanyProfileShare"
    WHERE "toUserId" = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT 50
  `;

  if (rows.length === 0) return [];

  const profileIds = [...new Set(rows.map((r) => r.profileId))];
  const fromIds = [...new Set(rows.map((r) => r.fromUserId))];

  const [profiles, fromUsers] = await Promise.all([
    prisma.profile.findMany({
      where: { id: { in: profileIds } },
      include: { user: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: { id: { in: fromIds } },
      include: { company: true },
    }),
  ]);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const fromById = new Map(
    fromUsers.map((u) => [
      u.id,
      u.company?.responsavelNome || u.name || u.email || "Colega",
    ]),
  );

  return rows.map((row) => {
    const profile = profileById.get(row.profileId);
    return {
      id: row.id,
      profileId: row.profileId,
      professionalName: profile?.user?.name || "Profissional",
      cargo:
        (profile as { cargoDesejado?: string | null } | undefined)?.cargoDesejado ||
        profile?.title ||
        null,
      fromUserId: row.fromUserId,
      fromName: fromById.get(row.fromUserId) || "Colega",
      toUserId: row.toUserId,
      note: row.note,
      createdAt: new Date(row.createdAt).toISOString(),
      readAt: row.readAt ? new Date(row.readAt).toISOString() : null,
    };
  });
}

export async function markProfileShareRead(userId: string, shareId: string): Promise<void> {
  await ensureCompanyProfileShareTable();
  await prisma.$executeRaw`
    UPDATE "CompanyProfileShare"
    SET "readAt" = NOW()
    WHERE id = ${shareId}
      AND "toUserId" = ${userId}
      AND "readAt" IS NULL
  `;
}
