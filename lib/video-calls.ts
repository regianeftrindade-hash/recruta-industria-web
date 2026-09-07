import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { resolveCompanyActor } from "@/lib/company/company-team";

export type VideoCallStatus = "RINGING" | "ACCEPTED" | "DECLINED" | "ENDED" | "MISSED";
export type TeamCallResponseStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export const MAX_COMPANY_PARTICIPANTS = 4;

export type VideoCallParticipantDTO = {
  id: string;
  callId: string;
  name: string;
  userId: string | null;
  joinedAt: string;
};

export type VideoCallDTO = {
  id: string;
  profileId: string;
  companyUserId: string;
  companyOwnerUserId: string;
  companyName: string;
  status: VideoCallStatus;
  createdAt: string;
  updatedAt: string;
};

export type TeamCallContext = {
  call: VideoCallDTO | null;
  isInitiator: boolean;
  teamStatus: "pending" | "accepted" | "declined" | null;
  initiatorName: string | null;
  participants: VideoCallParticipantDTO[];
};

let videoCallTableReady = false;

export async function ensureVideoCallTable(): Promise<void> {
  if (videoCallTableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VideoCallInvite" (
      "id" TEXT NOT NULL,
      "profileId" TEXT NOT NULL,
      "companyUserId" TEXT NOT NULL,
      "companyName" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'RINGING',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VideoCallInvite_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "VideoCallInvite_profileId_status_idx" ON "VideoCallInvite"("profileId", "status")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "VideoCallInvite_companyUserId_idx" ON "VideoCallInvite"("companyUserId")`,
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VideoCallParticipant" (
      "id" TEXT NOT NULL,
      "callId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VideoCallParticipant_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "VideoCallParticipant_callId_idx" ON "VideoCallParticipant"("callId")`,
  );
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VideoCallInvite"
    ADD COLUMN IF NOT EXISTS "companyOwnerUserId" TEXT
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "VideoCallInvite"
    SET "companyOwnerUserId" = "companyUserId"
    WHERE "companyOwnerUserId" IS NULL
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VideoCallTeamResponse" (
      "id" TEXT NOT NULL,
      "callId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "displayName" TEXT NOT NULL,
      "respondedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VideoCallTeamResponse_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "VideoCallTeamResponse_callId_userId_key" ON "VideoCallTeamResponse"("callId", "userId")`,
  );
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VideoCallParticipant"
    ADD COLUMN IF NOT EXISTS "userId" TEXT
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "VideoCallInvite_owner_profile_status_idx" ON "VideoCallInvite"("companyOwnerUserId", "profileId", "status")`,
  );
  videoCallTableReady = true;
}

type VideoCallRow = {
  id: string;
  profileId: string;
  companyUserId: string;
  companyOwnerUserId: string | null;
  companyName: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function mapRow(row: VideoCallRow): VideoCallDTO {
  return {
    id: row.id,
    profileId: row.profileId,
    companyUserId: row.companyUserId,
    companyOwnerUserId: row.companyOwnerUserId || row.companyUserId,
    companyName: row.companyName,
    status: row.status as VideoCallStatus,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

/** Encerra chamadas RINGING antigas (> 90s) como MISSED. */
async function expireStaleCalls(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    UPDATE "VideoCallInvite"
    SET status = 'MISSED', "updatedAt" = NOW()
    WHERE status = 'RINGING'
      AND "createdAt" < NOW() - INTERVAL '90 seconds'
  `);
}

export async function createVideoCallInvite(input: {
  profileId: string;
  companyUserId: string;
  companyOwnerUserId: string;
  companyName: string;
  initiatorName: string;
}): Promise<VideoCallDTO> {
  await ensureVideoCallTable();
  await expireStaleCalls();

  // Encerra outras chamadas ativas da mesma assinatura neste perfil
  await prisma.$executeRaw`
    UPDATE "VideoCallInvite"
    SET status = 'ENDED', "updatedAt" = NOW()
    WHERE "profileId" = ${input.profileId}
      AND COALESCE("companyOwnerUserId", "companyUserId") = ${input.companyOwnerUserId}
      AND status IN ('RINGING', 'ACCEPTED')
  `;

  const id = randomUUID();
  const initiatorName = input.initiatorName.trim().slice(0, 60) || input.companyName;
  await prisma.$executeRaw`
    INSERT INTO "VideoCallInvite" (
      id, "profileId", "companyUserId", "companyOwnerUserId", "companyName", status, "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${input.profileId}, ${input.companyUserId}, ${input.companyOwnerUserId}, ${input.companyName},
      'RINGING', NOW(), NOW()
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO "VideoCallParticipant" (id, "callId", name, "userId", "joinedAt")
    VALUES (${randomUUID()}, ${id}, ${initiatorName}, ${input.companyUserId}, NOW())
  `;

  const rows = await prisma.$queryRaw<VideoCallRow[]>`
    SELECT * FROM "VideoCallInvite" WHERE id = ${id} LIMIT 1
  `;

  return mapRow(rows[0]);
}

export async function getVideoCallById(id: string): Promise<VideoCallDTO | null> {
  await ensureVideoCallTable();
  await expireStaleCalls();
  const rows = await prisma.$queryRaw<VideoCallRow[]>`
    SELECT * FROM "VideoCallInvite" WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? mapRow(rows[0]) : null;
}

async function getActiveCallForSubscriptionProfile(
  companyOwnerUserId: string,
  profileId: string,
): Promise<VideoCallDTO | null> {
  await ensureVideoCallTable();
  await expireStaleCalls();
  const rows = await prisma.$queryRaw<VideoCallRow[]>`
    SELECT * FROM "VideoCallInvite"
    WHERE "profileId" = ${profileId}
      AND COALESCE("companyOwnerUserId", "companyUserId") = ${companyOwnerUserId}
      AND status IN ('RINGING', 'ACCEPTED')
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  return rows[0] ? mapRow(rows[0]) : null;
}

async function getTeamResponse(callId: string, userId: string) {
  await ensureVideoCallTable();
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      callId: string;
      userId: string;
      status: string;
      displayName: string;
      respondedAt: Date | null;
    }>
  >`
    SELECT * FROM "VideoCallTeamResponse"
    WHERE "callId" = ${callId} AND "userId" = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getTeamCallContext(userId: string, profileId: string): Promise<TeamCallContext> {
  const actor = await resolveCompanyActor(userId);
  if (!actor) {
    return { call: null, isInitiator: false, teamStatus: null, initiatorName: null, participants: [] };
  }

  const call = await getActiveCallForSubscriptionProfile(actor.ownerUserId, profileId);
  if (!call) {
    return { call: null, isInitiator: false, teamStatus: null, initiatorName: null, participants: [] };
  }

  const participants = await listCallParticipants(call.id);
  const isInitiator = call.companyUserId === userId;
  if (isInitiator) {
    return { call, isInitiator: true, teamStatus: null, initiatorName: null, participants };
  }

  const response = await getTeamResponse(call.id, userId);
  if (response?.status === "DECLINED") {
    return {
      call: null,
      isInitiator: false,
      teamStatus: "declined",
      initiatorName: null,
      participants: [],
    };
  }

  const initiator = await prisma.user.findUnique({
    where: { id: call.companyUserId },
    select: { name: true },
  });

  return {
    call,
    isInitiator: false,
    teamStatus: response?.status === "ACCEPTED" ? "accepted" : "pending",
    initiatorName: initiator?.name || call.companyName,
    participants,
  };
}

export async function respondTeamVideoCall(input: {
  userId: string;
  profileId: string;
  callId: string;
  action: "accept" | "decline";
  displayName: string;
}): Promise<{ call: VideoCallDTO; participants: VideoCallParticipantDTO[] }> {
  await ensureVideoCallTable();
  const actor = await resolveCompanyActor(input.userId);
  if (!actor) throw new Error("FORBIDDEN");

  const call = await getVideoCallById(input.callId);
  if (!call || call.profileId !== input.profileId) {
    throw new Error("CALL_NOT_FOUND");
  }
  if (call.companyOwnerUserId !== actor.ownerUserId) {
    throw new Error("FORBIDDEN");
  }
  if (call.companyUserId === input.userId) {
    throw new Error("INITIATOR_CANNOT_TEAM_RESPOND");
  }
  if (call.status !== "RINGING" && call.status !== "ACCEPTED") {
    throw new Error("CALL_NOT_ACTIVE");
  }

  const cleanName = input.displayName.trim().slice(0, 60) || "Participante";
  const nextStatus: TeamCallResponseStatus = input.action === "accept" ? "ACCEPTED" : "DECLINED";
  const existing = await getTeamResponse(call.id, input.userId);

  if (existing) {
    await prisma.$executeRaw`
      UPDATE "VideoCallTeamResponse"
      SET status = ${nextStatus}, "displayName" = ${cleanName}, "respondedAt" = NOW()
      WHERE id = ${existing.id}
    `;
  } else {
    await prisma.$executeRaw`
      INSERT INTO "VideoCallTeamResponse" (
        id, "callId", "userId", status, "displayName", "respondedAt", "createdAt"
      ) VALUES (
        ${randomUUID()}, ${call.id}, ${input.userId}, ${nextStatus}, ${cleanName}, NOW(), NOW()
      )
    `;
  }

  let participants = await listCallParticipants(call.id);
  if (input.action === "accept") {
    participants = await addCallParticipant(call.id, cleanName, input.userId);
  }

  const updated = await getVideoCallById(call.id);
  if (!updated) throw new Error("CALL_NOT_FOUND");
  return { call: updated, participants };
}

export async function getIncomingCallForProfile(profileId: string): Promise<VideoCallDTO | null> {
  await ensureVideoCallTable();
  await expireStaleCalls();
  const rows = await prisma.$queryRaw<VideoCallRow[]>`
    SELECT * FROM "VideoCallInvite"
    WHERE "profileId" = ${profileId}
      AND status = 'RINGING'
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function respondVideoCall(
  callId: string,
  profileId: string,
  action: "accept" | "decline",
): Promise<VideoCallDTO> {
  await ensureVideoCallTable();
  const call = await getVideoCallById(callId);
  if (!call || call.profileId !== profileId) {
    throw new Error("CALL_NOT_FOUND");
  }
  if (call.status !== "RINGING") {
    throw new Error("CALL_NOT_RINGING");
  }
  const next = action === "accept" ? "ACCEPTED" : "DECLINED";
  await prisma.$executeRaw`
    UPDATE "VideoCallInvite"
    SET status = ${next}, "updatedAt" = NOW()
    WHERE id = ${callId}
  `;
  const updated = await getVideoCallById(callId);
  if (!updated) throw new Error("CALL_NOT_FOUND");
  return updated;
}

export async function listCallParticipants(callId: string): Promise<VideoCallParticipantDTO[]> {
  await ensureVideoCallTable();
  const rows = await prisma.$queryRaw<
    Array<{ id: string; callId: string; name: string; userId: string | null; joinedAt: Date }>
  >`
    SELECT * FROM "VideoCallParticipant"
    WHERE "callId" = ${callId}
    ORDER BY "joinedAt" ASC
  `;
  return rows.map((r) => ({
    id: r.id,
    callId: r.callId,
    name: r.name,
    userId: r.userId,
    joinedAt: new Date(r.joinedAt).toISOString(),
  }));
}

/** Adiciona um participante da empresa à chamada (máx. 4). */
export async function addCallParticipant(
  callId: string,
  name: string,
  userId?: string,
): Promise<VideoCallParticipantDTO[]> {
  await ensureVideoCallTable();
  const participants = await listCallParticipants(callId);
  if (userId && participants.some((p) => p.userId === userId)) {
    return participants;
  }
  if (participants.length >= MAX_COMPANY_PARTICIPANTS) {
    throw new Error("CALL_FULL");
  }
  const cleanName = name.trim().slice(0, 60) || `Participante ${participants.length + 1}`;
  await prisma.$executeRaw`
    INSERT INTO "VideoCallParticipant" (id, "callId", name, "userId", "joinedAt")
    VALUES (${randomUUID()}, ${callId}, ${cleanName}, ${userId ?? null}, NOW())
  `;
  return listCallParticipants(callId);
}

export async function removeCallParticipant(callId: string, participantId: string): Promise<VideoCallParticipantDTO[]> {
  await ensureVideoCallTable();
  await prisma.$executeRaw`
    DELETE FROM "VideoCallParticipant"
    WHERE id = ${participantId} AND "callId" = ${callId}
  `;
  return listCallParticipants(callId);
}

export async function endVideoCall(callId: string, actor: {
  companyUserId?: string;
  profileId?: string;
}): Promise<VideoCallDTO> {
  await ensureVideoCallTable();
  const call = await getVideoCallById(callId);
  if (!call) throw new Error("CALL_NOT_FOUND");
  if (actor.companyUserId) {
    const actorCtx = await resolveCompanyActor(actor.companyUserId);
    const sameSubscription =
      actorCtx?.ownerUserId === call.companyOwnerUserId ||
      call.companyUserId === actor.companyUserId;
    if (!sameSubscription) throw new Error("FORBIDDEN");
  }
  if (actor.profileId && call.profileId !== actor.profileId) {
    throw new Error("FORBIDDEN");
  }
  await prisma.$executeRaw`
    UPDATE "VideoCallInvite"
    SET status = 'ENDED', "updatedAt" = NOW()
    WHERE id = ${callId}
  `;
  const updated = await getVideoCallById(callId);
  if (!updated) throw new Error("CALL_NOT_FOUND");
  return updated;
}
