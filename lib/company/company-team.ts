import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getEffectiveMaxUsers } from "@/lib/company/company-extra-seats";

export type TeamMemberRole = "OWNER" | "ADMIN" | "RH" | "RECRUITER";
export type TeamMemberStatus = "PENDING" | "ACTIVE" | "REVOKED";

export type CompanyTeamMemberDTO = {
  id: string;
  companyOwnerUserId: string;
  memberUserId: string | null;
  invitedEmail: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  inviteToken: string | null;
  invitedAt: string;
  acceptedAt: string | null;
  name: string | null;
};

type TeamRow = {
  id: string;
  companyOwnerUserId: string;
  memberUserId: string | null;
  invitedEmail: string;
  role: string;
  status: string;
  inviteToken: string | null;
  invitedAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
};

let teamTableReady = false;

export async function ensureCompanyTeamTable(): Promise<void> {
  if (teamTableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyTeamMember" (
      "id" TEXT NOT NULL,
      "companyOwnerUserId" TEXT NOT NULL,
      "memberUserId" TEXT,
      "invitedEmail" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'RH',
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "inviteToken" TEXT,
      "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "acceptedAt" TIMESTAMP(3),
      "revokedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompanyTeamMember_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "CompanyTeamMember_owner_email_uidx" ON "CompanyTeamMember"("companyOwnerUserId", "invitedEmail")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "CompanyTeamMember_inviteToken_uidx" ON "CompanyTeamMember"("inviteToken")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CompanyTeamMember_memberUserId_idx" ON "CompanyTeamMember"("memberUserId")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CompanyTeamMember_owner_status_idx" ON "CompanyTeamMember"("companyOwnerUserId", "status")`,
  );
  teamTableReady = true;
}

function mapRow(row: TeamRow, name?: string | null): CompanyTeamMemberDTO {
  return {
    id: row.id,
    companyOwnerUserId: row.companyOwnerUserId,
    memberUserId: row.memberUserId,
    invitedEmail: row.invitedEmail,
    role: row.role as TeamMemberRole,
    status: row.status as TeamMemberStatus,
    inviteToken: row.inviteToken,
    invitedAt: new Date(row.invitedAt).toISOString(),
    acceptedAt: row.acceptedAt ? new Date(row.acceptedAt).toISOString() : null,
    name: name ?? null,
  };
}

/** Dono da assinatura: se o user for membro ACTIVE, devolve o owner; senão ele mesmo (se tiver Company). */
export async function resolveCompanyOwnerUserId(userId: string): Promise<string | null> {
  await ensureCompanyTeamTable();

  const memberRows = await prisma.$queryRaw<Array<{ companyOwnerUserId: string }>>`
    SELECT "companyOwnerUserId" FROM "CompanyTeamMember"
    WHERE "memberUserId" = ${userId}
      AND status = 'ACTIVE'
    ORDER BY "acceptedAt" DESC NULLS LAST
    LIMIT 1
  `;
  if (memberRows[0]?.companyOwnerUserId) {
    return memberRows[0].companyOwnerUserId;
  }

  const company = await prisma.company.findUnique({
    where: { userId },
    select: { userId: true },
  });
  return company?.userId ?? null;
}

export async function resolveCompanyActor(userId: string): Promise<{
  actorUserId: string;
  ownerUserId: string;
  teamRole: TeamMemberRole;
  isOwner: boolean;
} | null> {
  await ensureCompanyTeamTable();

  const memberRows = await prisma.$queryRaw<TeamRow[]>`
    SELECT * FROM "CompanyTeamMember"
    WHERE "memberUserId" = ${userId}
      AND status = 'ACTIVE'
    ORDER BY "acceptedAt" DESC NULLS LAST
    LIMIT 1
  `;
  if (memberRows[0]) {
    return {
      actorUserId: userId,
      ownerUserId: memberRows[0].companyOwnerUserId,
      teamRole: (memberRows[0].role as TeamMemberRole) || "RH",
      isOwner: false,
    };
  }

  const company = await prisma.company.findUnique({
    where: { userId },
    select: { userId: true },
  });
  if (!company) return null;

  return {
    actorUserId: userId,
    ownerUserId: userId,
    teamRole: "OWNER",
    isOwner: true,
  };
}

export async function countTeamSeats(ownerUserId: string): Promise<number> {
  await ensureCompanyTeamTable();
  // Dono (1) + membros PENDING/ACTIVE
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count FROM "CompanyTeamMember"
    WHERE "companyOwnerUserId" = ${ownerUserId}
      AND status IN ('PENDING', 'ACTIVE')
  `;
  return 1 + (rows[0]?.count || 0);
}

export async function listTeamMembers(ownerUserId: string): Promise<CompanyTeamMemberDTO[]> {
  await ensureCompanyTeamTable();

  const owner = await prisma.user.findUnique({
    where: { id: ownerUserId },
    include: { company: true },
  });

  const rows = await prisma.$queryRaw<TeamRow[]>`
    SELECT * FROM "CompanyTeamMember"
    WHERE "companyOwnerUserId" = ${ownerUserId}
      AND status IN ('PENDING', 'ACTIVE')
    ORDER BY "invitedAt" ASC
  `;

  const memberIds = rows.map((r) => r.memberUserId).filter(Boolean) as string[];
  const users =
    memberIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: memberIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  const ownerDto: CompanyTeamMemberDTO = {
    id: `owner-${ownerUserId}`,
    companyOwnerUserId: ownerUserId,
    memberUserId: ownerUserId,
    invitedEmail: owner?.email || "",
    role: "OWNER",
    status: "ACTIVE",
    inviteToken: null,
    invitedAt: owner?.createdAt?.toISOString() || new Date().toISOString(),
    acceptedAt: owner?.createdAt?.toISOString() || null,
    name: owner?.company?.responsavelNome || owner?.name || owner?.company?.name || "Administrador",
  };

  return [ownerDto, ...rows.map((r) => mapRow(r, r.memberUserId ? nameById.get(r.memberUserId) : null))];
}

export async function inviteTeamMember(input: {
  ownerUserId: string;
  email: string;
  role?: TeamMemberRole;
}): Promise<CompanyTeamMemberDTO> {
  await ensureCompanyTeamTable();

  const email = input.email.toLowerCase().trim();
  if (!email || !email.includes("@")) {
    throw new Error("EMAIL_INVALID");
  }

  const actor = await resolveCompanyActor(input.ownerUserId);
  if (!actor?.isOwner && actor?.teamRole !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  const ownerUserId = actor?.ownerUserId || input.ownerUserId;

  const owner = await prisma.user.findUnique({ where: { id: ownerUserId } });
  if (!owner) throw new Error("OWNER_NOT_FOUND");
  if (owner.email.toLowerCase() === email) {
    throw new Error("CANNOT_INVITE_SELF");
  }

  const { maxUsers } = await getEffectiveMaxUsers(ownerUserId);
  const seats = await countTeamSeats(ownerUserId);
  if (seats >= maxUsers) {
    throw new Error("SEAT_LIMIT");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (existingUser.role === "PROFESSIONAL") {
      throw new Error("EMAIL_IS_PROFESSIONAL");
    }
    const alreadyMember = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "CompanyTeamMember"
      WHERE "memberUserId" = ${existingUser.id}
        AND status = 'ACTIVE'
      LIMIT 1
    `;
    if (alreadyMember[0]) throw new Error("ALREADY_MEMBER_ELSEWHERE");

    const ownCompany = await prisma.company.findUnique({ where: { userId: existingUser.id } });
    if (ownCompany) throw new Error("EMAIL_HAS_OWN_COMPANY");
  }

  const existingInvite = await prisma.$queryRaw<TeamRow[]>`
    SELECT * FROM "CompanyTeamMember"
    WHERE "companyOwnerUserId" = ${ownerUserId}
      AND lower("invitedEmail") = ${email}
    LIMIT 1
  `;

  const role: TeamMemberRole =
    input.role === "ADMIN" || input.role === "RECRUITER" || input.role === "RH" ? input.role : "RH";
  const token = randomBytes(24).toString("hex");
  const id = randomUUID();

  if (existingInvite[0]) {
    if (existingInvite[0].status === "ACTIVE") throw new Error("ALREADY_ACTIVE");
    await prisma.$executeRaw`
      UPDATE "CompanyTeamMember"
      SET status = 'PENDING',
          role = ${role},
          "inviteToken" = ${token},
          "invitedAt" = NOW(),
          "acceptedAt" = NULL,
          "revokedAt" = NULL,
          "updatedAt" = NOW()
      WHERE id = ${existingInvite[0].id}
    `;
    const updated = await prisma.$queryRaw<TeamRow[]>`
      SELECT * FROM "CompanyTeamMember" WHERE id = ${existingInvite[0].id} LIMIT 1
    `;
    return mapRow(updated[0]);
  }

  await prisma.$executeRaw`
    INSERT INTO "CompanyTeamMember" (
      id, "companyOwnerUserId", "memberUserId", "invitedEmail", role, status,
      "inviteToken", "invitedAt", "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${ownerUserId}, NULL, ${email}, ${role}, 'PENDING',
      ${token}, NOW(), NOW(), NOW()
    )
  `;

  const rows = await prisma.$queryRaw<TeamRow[]>`
    SELECT * FROM "CompanyTeamMember" WHERE id = ${id} LIMIT 1
  `;
  return mapRow(rows[0]);
}

export async function revokeTeamMember(input: {
  ownerUserId: string;
  memberId: string;
}): Promise<void> {
  await ensureCompanyTeamTable();
  const actor = await resolveCompanyActor(input.ownerUserId);
  if (!actor?.isOwner && actor?.teamRole !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  const ownerUserId = actor.ownerUserId;

  if (input.memberId.startsWith("owner-")) {
    throw new Error("CANNOT_REVOKE_OWNER");
  }

  await prisma.$executeRaw`
    UPDATE "CompanyTeamMember"
    SET status = 'REVOKED',
        "revokedAt" = NOW(),
        "inviteToken" = NULL,
        "updatedAt" = NOW()
    WHERE id = ${input.memberId}
      AND "companyOwnerUserId" = ${ownerUserId}
  `;
}

/**
 * Troca um usuário da equipe: remove o antigo e convida o novo no mesmo assento.
 * Não exige comprar outro plano nem usuário extra.
 */
export async function replaceTeamMember(input: {
  ownerUserId: string;
  memberId: string;
  email: string;
  role?: TeamMemberRole;
}): Promise<CompanyTeamMemberDTO> {
  await revokeTeamMember({
    ownerUserId: input.ownerUserId,
    memberId: input.memberId,
  });
  return inviteTeamMember({
    ownerUserId: input.ownerUserId,
    email: input.email,
    role: input.role,
  });
}

export async function getInviteByToken(token: string): Promise<{
  invite: CompanyTeamMemberDTO;
  companyName: string;
} | null> {
  await ensureCompanyTeamTable();
  const rows = await prisma.$queryRaw<TeamRow[]>`
    SELECT * FROM "CompanyTeamMember"
    WHERE "inviteToken" = ${token}
      AND status = 'PENDING'
    LIMIT 1
  `;
  if (!rows[0]) return null;

  const owner = await prisma.user.findUnique({
    where: { id: rows[0].companyOwnerUserId },
    include: { company: true },
  });

  return {
    invite: mapRow(rows[0]),
    companyName: owner?.company?.name || "Empresa",
  };
}

export async function acceptTeamInvite(input: {
  token: string;
  name: string;
  password: string;
}): Promise<{ userId: string; email: string }> {
  await ensureCompanyTeamTable();

  const found = await getInviteByToken(input.token);
  if (!found) throw new Error("INVITE_NOT_FOUND");

  const email = found.invite.invitedEmail.toLowerCase();
  const password = input.password.trim();
  if (password.length < 6) throw new Error("PASSWORD_WEAK");

  const name = input.name.trim() || email.split("@")[0];
  const passwordHash = await bcrypt.hash(password, 10);

  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    if (user.role === "PROFESSIONAL") throw new Error("EMAIL_IS_PROFESSIONAL");
    const ownCompany = await prisma.company.findUnique({ where: { userId: user.id } });
    if (ownCompany) throw new Error("EMAIL_HAS_OWN_COMPANY");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        passwordHash,
        role: "COMPANY",
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "COMPANY",
      },
    });
  }

  await prisma.$executeRaw`
    UPDATE "CompanyTeamMember"
    SET status = 'ACTIVE',
        "memberUserId" = ${user.id},
        "acceptedAt" = NOW(),
        "inviteToken" = NULL,
        "updatedAt" = NOW()
    WHERE id = ${found.invite.id}
  `;

  return { userId: user.id, email: user.email };
}

/** Lista membros ACTIVE da mesma assinatura (para chat/video). */
export async function listActiveTeamPeers(userId: string): Promise<
  Array<{ id: string; name: string; email: string; companyName: string; department: string }>
> {
  const actor = await resolveCompanyActor(userId);
  if (!actor) return [];

  const owner = await prisma.user.findUnique({
    where: { id: actor.ownerUserId },
    include: { company: true },
  });
  const companyName = owner?.company?.name || "";

  const members = await listTeamMembers(actor.ownerUserId);
  return members
    .filter((m) => m.status === "ACTIVE" && m.memberUserId && m.memberUserId !== userId)
    .map((m) => ({
      id: m.memberUserId as string,
      name: m.name || m.invitedEmail,
      email: m.invitedEmail,
      companyName,
      department:
        m.role === "OWNER"
          ? "Administrador"
          : m.role === "RECRUITER"
            ? "Recrutamento"
            : m.role === "ADMIN"
              ? "Admin"
              : "RH",
    }));
}

/** Chave única da assinatura compartilhada (chat interno da equipe). */
export function getCompanySubscriptionKey(ownerUserId: string): string {
  return `subscription:${ownerUserId}`;
}

/** Valida se o alvo faz parte da mesma assinatura/plano (equipe ACTIVE). */
export async function assertInviteableTeamPeer(
  userId: string,
  target: { memberUserId?: string; name?: string },
): Promise<void> {
  const peers = await listActiveTeamPeers(userId);
  const memberUserId = target.memberUserId?.trim();
  const name = target.name?.trim().toLowerCase();

  const found = peers.find((peer) => {
    if (memberUserId && peer.id === memberUserId) return true;
    if (name && peer.name.trim().toLowerCase() === name) return true;
    return false;
  });

  if (!found) {
    throw new Error("NOT_SAME_PLAN");
  }
}
