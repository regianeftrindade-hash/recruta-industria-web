import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { ensureJobProposalTables } from "@/lib/ensure-db-schema";
import { upsertCompanyProfileTracking } from "@/lib/company/company-profile-tracking";
import { limiteRetencaoInbox } from "@/lib/profile/inbox-retention";
import type {
  ProposalStatus,
  InterviewLocationType,
  InterviewStatus,
  JobInterviewDTO,
  JobProposalDTO,
} from "@/lib/company/job-proposals-shared";

export type {
  ProposalStatus,
  InterviewLocationType,
  InterviewStatus,
  JobInterviewDTO,
  JobProposalDTO,
  InterviewComprovanteInput,
} from "@/lib/company/job-proposals-shared";
export { formatInterviewComprovante } from "@/lib/company/job-proposals-shared";

export type ScheduledInterviewDTO = {
  proposalId: string;
  profileId: string;
  professionalName: string;
  cargo: string;
  companyName: string;
  scheduledAt: string;
  locationType: InterviewLocationType;
  address: string | null;
  meetingUrl: string | null;
  observacoes: string;
  interviewStatus: InterviewStatus;
  proposalStatus: ProposalStatus;
};

/** Remove propostas (e entrevistas) com mais de 1 mês. */
export async function limparPropostasExpiradas(scope?: {
  profileId?: string;
  companyUserId?: string;
}): Promise<void> {
  await ensureJobProposalTables();
  const limite = limiteRetencaoInbox();

  if (scope?.profileId) {
    await prisma.$executeRaw`
      DELETE FROM "JobInterview"
      WHERE "proposalId" IN (
        SELECT id FROM "JobProposal"
        WHERE "profileId" = ${scope.profileId} AND "createdAt" < ${limite}
      )
    `;
    await prisma.$executeRaw`
      DELETE FROM "JobProposal"
      WHERE "profileId" = ${scope.profileId} AND "createdAt" < ${limite}
    `;
    return;
  }

  if (scope?.companyUserId) {
    await prisma.$executeRaw`
      DELETE FROM "JobInterview"
      WHERE "proposalId" IN (
        SELECT id FROM "JobProposal"
        WHERE "companyUserId" = ${scope.companyUserId} AND "createdAt" < ${limite}
      )
    `;
    await prisma.$executeRaw`
      DELETE FROM "JobProposal"
      WHERE "companyUserId" = ${scope.companyUserId} AND "createdAt" < ${limite}
    `;
    return;
  }

  await prisma.$executeRaw`
    DELETE FROM "JobInterview"
    WHERE "proposalId" IN (
      SELECT id FROM "JobProposal" WHERE "createdAt" < ${limite}
    )
  `;
  await prisma.$executeRaw`
    DELETE FROM "JobProposal" WHERE "createdAt" < ${limite}
  `;
}

type ProposalRow = {
  id: string;
  profileId: string;
  companyUserId: string;
  companyName: string;
  cargo: string;
  salario: string;
  turno: string;
  cidade: string;
  beneficios: string;
  mensagem: string;
  status: string;
  respondedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  interviewId: string | null;
  scheduledAt: Date | null;
  locationType: string | null;
  address: string | null;
  meetingUrl: string | null;
  observacoes: string | null;
  interviewStatus: string | null;
};

function mapRow(row: ProposalRow): JobProposalDTO {
  let interview: JobInterviewDTO | null = null;
  if (row.interviewId && row.scheduledAt && row.locationType) {
    const when =
      row.scheduledAt instanceof Date
        ? row.scheduledAt
        : new Date(row.scheduledAt as unknown as string);
    interview = {
      id: row.interviewId,
      scheduledAt: Number.isNaN(when.getTime()) ? new Date().toISOString() : when.toISOString(),
      locationType:
        row.locationType === "PLATFORM"
          ? "PLATFORM"
          : row.locationType === "ONLINE"
            ? "ONLINE"
            : "PRESENTIAL",
      address: row.address,
      meetingUrl: row.meetingUrl,
      observacoes: row.observacoes ?? "",
      status: (row.interviewStatus as InterviewStatus) || "PENDING",
    };
  }

  return {
    id: row.id,
    profileId: row.profileId,
    companyUserId: row.companyUserId,
    companyName: row.companyName,
    cargo: row.cargo,
    salario: row.salario,
    turno: row.turno,
    cidade: row.cidade,
    beneficios: row.beneficios,
    mensagem: row.mensagem,
    status: row.status as ProposalStatus,
    respondedAt: row.respondedAt
      ? (row.respondedAt instanceof Date
          ? row.respondedAt.toISOString()
          : new Date(row.respondedAt as unknown as string).toISOString())
      : null,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt as unknown as string).toISOString(),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : new Date(row.updatedAt as unknown as string).toISOString(),
    interview,
    tracking: {
      contatado: false,
      entrevistado: false,
      emTeste: false,
      contratado: false,
      naoContratado: false,
      entrevistaCancelada: false,
    },
  };
}

const SELECT_JOIN = `
  SELECT
    p.id, p."profileId", p."companyUserId", p."companyName",
    p.cargo, p.salario, p.turno, p.cidade, p.beneficios, p.mensagem,
    p.status, p."respondedAt", p."createdAt", p."updatedAt",
    i.id AS "interviewId", i."scheduledAt", i."locationType",
    i.address, i."meetingUrl", i.observacoes, i.status AS "interviewStatus"
  FROM "JobProposal" p
  LEFT JOIN "JobInterview" i ON i."proposalId" = p.id
`;

export async function createJobProposal(input: {
  profileId: string;
  companyUserId: string;
  companyName: string;
  cargo: string;
  salario: string;
  turno: string;
  cidade: string;
  beneficios: string;
  mensagem: string;
}): Promise<JobProposalDTO> {
  await ensureJobProposalTables();
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "JobProposal" (
      id, "profileId", "companyUserId", "companyName",
      cargo, salario, turno, cidade, beneficios, mensagem,
      status, "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${input.profileId}, ${input.companyUserId}, ${input.companyName},
      ${input.cargo}, ${input.salario}, ${input.turno}, ${input.cidade},
      ${input.beneficios}, ${input.mensagem},
      'SENT', NOW(), NOW()
    )
  `;

  await upsertCompanyProfileTracking(input.companyUserId, input.profileId, { contatado: true });

  const created = await getProposalById(id);
  if (!created) throw new Error("Falha ao criar proposta");
  return created;
}

export async function getProposalById(id: string): Promise<JobProposalDTO | null> {
  await ensureJobProposalTables();
  const rows = await prisma.$queryRawUnsafe<ProposalRow[]>(
    `${SELECT_JOIN} WHERE p.id = $1 LIMIT 1`,
    id,
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

/** Exclui proposta (e entrevista) do profissional — respeita retenção de 1 mês via limpeza automática. */
export async function deleteProposalForProfessional(
  proposalId: string,
  profileId: string,
): Promise<void> {
  await ensureJobProposalTables();
  const proposal = await getProposalById(proposalId);
  if (!proposal || proposal.profileId !== profileId) {
    throw new Error("PROPOSAL_NOT_FOUND");
  }
  await prisma.$executeRaw`DELETE FROM "JobInterview" WHERE "proposalId" = ${proposalId}`;
  await prisma.$executeRaw`DELETE FROM "JobProposal" WHERE id = ${proposalId} AND "profileId" = ${profileId}`;
}

export async function deleteProposalForCompany(
  proposalId: string,
  companyUserId: string,
): Promise<void> {
  await ensureJobProposalTables();
  const proposal = await getProposalById(proposalId);
  if (!proposal || proposal.companyUserId !== companyUserId) {
    throw new Error("PROPOSAL_NOT_FOUND");
  }
  await prisma.$executeRaw`DELETE FROM "JobInterview" WHERE "proposalId" = ${proposalId}`;
  await prisma.$executeRaw`DELETE FROM "JobProposal" WHERE id = ${proposalId} AND "companyUserId" = ${companyUserId}`;
}

export async function listProposalsForCompanyProfile(
  companyUserId: string,
  profileId: string,
): Promise<JobProposalDTO[]> {
  await limparPropostasExpiradas({ companyUserId });
  await ensureJobProposalTables();
  const rows = await prisma.$queryRawUnsafe<ProposalRow[]>(
    `${SELECT_JOIN}
     WHERE p."companyUserId" = $1 AND p."profileId" = $2
     ORDER BY p."createdAt" DESC`,
    companyUserId,
    profileId,
  );
  return attachTrackingForCompany(rows.map(mapRow), companyUserId);
}

/** Todas as oportunidades da empresa (propostas, entrevistas, arquivadas) com tracking. */
export async function listOpportunitiesForCompany(
  companyUserId: string,
): Promise<JobProposalDTO[]> {
  await limparPropostasExpiradas({ companyUserId });
  await ensureJobProposalTables();

  type RowWithName = ProposalRow & { professionalName: string | null };

  const rows = await prisma.$queryRawUnsafe<RowWithName[]>(
    `SELECT
      p.id, p."profileId", p."companyUserId", p."companyName",
      p.cargo, p.salario, p.turno, p.cidade, p.beneficios, p.mensagem,
      p.status, p."respondedAt", p."createdAt", p."updatedAt",
      i.id AS "interviewId", i."scheduledAt", i."locationType",
      i.address, i."meetingUrl", i.observacoes, i.status AS "interviewStatus",
      COALESCE(u.name, pr.email, 'Profissional') AS "professionalName"
    FROM "JobProposal" p
    LEFT JOIN "JobInterview" i ON i."proposalId" = p.id
    INNER JOIN "Profile" pr ON pr.id = p."profileId"
    LEFT JOIN "User" u ON u.id = pr."userId"
    WHERE p."companyUserId" = $1
    ORDER BY p."createdAt" DESC`,
    companyUserId,
  );

  const mapped = rows.map((row) => {
    const dto = mapRow(row);
    dto.professionalName = row.professionalName || "Profissional";
    return dto;
  });

  return attachTrackingForCompany(mapped, companyUserId);
}

export type CompanyRecruitmentHistoryCounts = {
  propostas: number;
  entrevistas: number;
  testes: number;
  contratacoes: number;
  naoContratacoes: number;
};

export async function getCompanyRecruitmentHistory(
  companyUserId: string,
): Promise<CompanyRecruitmentHistoryCounts> {
  await ensureJobProposalTables();

  const [proposalRows, trackingRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ propostas: bigint }>>(
      `SELECT COUNT(*)::bigint AS propostas
       FROM "JobProposal"
       WHERE "companyUserId" = $1`,
      companyUserId,
    ).catch(() => [{ propostas: BigInt(0) }]),
    prisma.$queryRawUnsafe<
      Array<{
        entrevistas: bigint;
        testes: bigint;
        contratacoes: bigint;
        naoContratacoes: bigint;
      }>
    >(
      `SELECT
         COUNT(*) FILTER (WHERE entrevistado = true)::bigint AS entrevistas,
         COUNT(*) FILTER (WHERE "emTeste" = true)::bigint AS testes,
         COUNT(*) FILTER (WHERE contratado = true)::bigint AS contratacoes,
         COUNT(*) FILTER (WHERE "naoContratado" = true)::bigint AS "naoContratacoes"
       FROM "CompanyProfileTracking"
       WHERE "companyUserId" = $1`,
      companyUserId,
    ).catch(() => [
      {
        entrevistas: BigInt(0),
        testes: BigInt(0),
        contratacoes: BigInt(0),
        naoContratacoes: BigInt(0),
      },
    ]),
  ]);

  return {
    propostas: Number(proposalRows[0]?.propostas || 0),
    entrevistas: Number(trackingRows[0]?.entrevistas || 0),
    testes: Number(trackingRows[0]?.testes || 0),
    contratacoes: Number(trackingRows[0]?.contratacoes || 0),
    naoContratacoes: Number(trackingRows[0]?.naoContratacoes || 0),
  };
}

async function attachTrackingForCompany(
  proposals: JobProposalDTO[],
  companyUserId: string,
): Promise<JobProposalDTO[]> {
  if (proposals.length === 0) return proposals;
  try {
    const trackRows = await prisma.$queryRawUnsafe<
      Array<{
        profileId: string;
        contatado: boolean;
        entrevistado: boolean;
        emTeste: boolean;
        contratado: boolean;
        naoContratado: boolean;
        entrevistaCancelada: boolean;
      }>
    >(
      `SELECT "profileId",
              contatado,
              entrevistado,
              COALESCE("emTeste", false) AS "emTeste",
              contratado,
              COALESCE("naoContratado", false) AS "naoContratado",
              COALESCE("entrevistaCancelada", false) AS "entrevistaCancelada"
       FROM "CompanyProfileTracking"
       WHERE "companyUserId" = $1`,
      companyUserId,
    );
    const byProfile = new Map(
      trackRows.map((t) => [
        t.profileId,
        {
          contatado: Boolean(t.contatado),
          entrevistado: Boolean(t.entrevistado),
          emTeste: Boolean(t.emTeste),
          contratado: Boolean(t.contratado),
          naoContratado: Boolean(t.naoContratado),
          entrevistaCancelada: Boolean(t.entrevistaCancelada),
        },
      ]),
    );
    return proposals.map((p) => ({
      ...p,
      tracking: byProfile.get(p.profileId) || p.tracking,
    }));
  } catch {
    return proposals;
  }
}

export async function listProposalsForProfessional(profileId: string): Promise<JobProposalDTO[]> {
  await limparPropostasExpiradas({ profileId });
  await ensureJobProposalTables();
  const rows = await prisma.$queryRawUnsafe<ProposalRow[]>(
    `${SELECT_JOIN}
     WHERE p."profileId" = $1
     ORDER BY p."createdAt" DESC`,
    profileId,
  );
  const mapped = rows.map(mapRow);
  if (mapped.length === 0) return mapped;

  try {
    const trackRows = await prisma.$queryRawUnsafe<
      Array<{
        companyUserId: string;
        contatado: boolean;
        entrevistado: boolean;
        emTeste: boolean;
        contratado: boolean;
        naoContratado: boolean;
        entrevistaCancelada: boolean;
      }>
    >(
      `SELECT "companyUserId",
              contatado,
              entrevistado,
              COALESCE("emTeste", false) AS "emTeste",
              contratado,
              COALESCE("naoContratado", false) AS "naoContratado",
              COALESCE("entrevistaCancelada", false) AS "entrevistaCancelada"
       FROM "CompanyProfileTracking"
       WHERE "profileId" = $1`,
      profileId,
    );
    const byCompany = new Map(
      trackRows.map((t) => [
        t.companyUserId,
        {
          contatado: Boolean(t.contatado),
          entrevistado: Boolean(t.entrevistado),
          emTeste: Boolean(t.emTeste),
          contratado: Boolean(t.contratado),
          naoContratado: Boolean(t.naoContratado),
          entrevistaCancelada: Boolean(t.entrevistaCancelada),
        },
      ]),
    );
    return mapped.map((p) => ({
      ...p,
      tracking: byCompany.get(p.companyUserId) || p.tracking,
    }));
  } catch {
    return mapped;
  }
}

export async function listScheduledInterviewsForCompany(
  companyUserId: string,
): Promise<ScheduledInterviewDTO[]> {
  // Schema só na 1ª chamada (cache em memória); limpeza não bloqueia a listagem
  await ensureJobProposalTables();
  void limparPropostasExpiradas({ companyUserId }).catch(() => {});

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      proposalId: string;
      profileId: string;
      professionalName: string | null;
      cargo: string;
      companyName: string;
      scheduledAt: Date;
      locationType: string;
      address: string | null;
      meetingUrl: string | null;
      observacoes: string;
      interviewStatus: string;
      proposalStatus: string;
    }>
  >(
    `SELECT
      p.id AS "proposalId",
      p."profileId",
      COALESCE(u.name, pr.email, 'Profissional') AS "professionalName",
      p.cargo,
      p."companyName",
      i."scheduledAt",
      i."locationType",
      i.address,
      i."meetingUrl",
      i.observacoes,
      i.status AS "interviewStatus",
      p.status AS "proposalStatus"
    FROM "JobProposal" p
    INNER JOIN "JobInterview" i ON i."proposalId" = p.id
    INNER JOIN "Profile" pr ON pr.id = p."profileId"
    LEFT JOIN "User" u ON u.id = pr."userId"
    WHERE p."companyUserId" = $1
      AND p.status IN ('INTERVIEW_PENDING', 'INTERVIEW_CONFIRMED')
      AND i.status IN ('PENDING', 'CONFIRMED')
    ORDER BY i."scheduledAt" ASC`,
    companyUserId,
  );

  return rows.map((r) => {
    const when =
      r.scheduledAt instanceof Date
        ? r.scheduledAt
        : new Date(r.scheduledAt as unknown as string);
    return {
      proposalId: r.proposalId,
      profileId: r.profileId,
      professionalName: r.professionalName || "Profissional",
      cargo: r.cargo,
      companyName: r.companyName,
      scheduledAt: Number.isNaN(when.getTime()) ? new Date().toISOString() : when.toISOString(),
      locationType: (r.locationType === "PLATFORM"
        ? "PLATFORM"
        : r.locationType === "ONLINE"
          ? "ONLINE"
          : "PRESENTIAL") as InterviewLocationType,
      address: r.address,
      meetingUrl: r.meetingUrl,
      observacoes: r.observacoes,
      interviewStatus: (r.interviewStatus as InterviewStatus) || "PENDING",
      proposalStatus: r.proposalStatus as ProposalStatus,
    };
  });
}

export async function respondToProposal(
  proposalId: string,
  profileId: string,
  action: "INTERESTED" | "MORE_INFO" | "DECLINED",
): Promise<JobProposalDTO> {
  await ensureJobProposalTables();
  const proposal = await getProposalById(proposalId);
  if (!proposal || proposal.profileId !== profileId) {
    throw new Error("PROPOSAL_NOT_FOUND");
  }
  if (proposal.status !== "SENT" && proposal.status !== "MORE_INFO") {
    throw new Error("PROPOSAL_NOT_RESPONDABLE");
  }

  const nextStatus: ProposalStatus =
    action === "INTERESTED" ? "INTERESTED" : action === "MORE_INFO" ? "MORE_INFO" : "DECLINED";

  await prisma.$executeRaw`
    UPDATE "JobProposal"
    SET status = ${nextStatus}, "respondedAt" = NOW(), "updatedAt" = NOW()
    WHERE id = ${proposalId}
  `;

  if (action === "INTERESTED") {
    await upsertCompanyProfileTracking(proposal.companyUserId, profileId, { contatado: true });
  }

  if (action === "MORE_INFO") {
    const id = randomUUID();
    const body =
      `Solicitei mais informações sobre a proposta de ${proposal.cargo} em ${proposal.cidade}. Aguardo o retorno da empresa.`;
    await prisma.$executeRaw`
      INSERT INTO "ProfileMessage" (id, "profileId", "companyUserId", "companyName", body, "createdAt", "senderRole", "replyToId")
      VALUES (
        ${id},
        ${profileId},
        ${proposal.companyUserId},
        ${"Profissional"},
        ${body},
        NOW(),
        ${"PROFESSIONAL"},
        ${null}
      )
    `;
  }

  const updated = await getProposalById(proposalId);
  if (!updated) throw new Error("PROPOSAL_NOT_FOUND");
  return updated;
}

export async function scheduleInterview(input: {
  proposalId: string;
  companyUserId: string;
  scheduledAt: Date;
  locationType: InterviewLocationType;
  address?: string;
  meetingUrl?: string;
  observacoes: string;
}): Promise<JobProposalDTO> {
  await ensureJobProposalTables();
  const proposal = await getProposalById(input.proposalId);
  if (!proposal || proposal.companyUserId !== input.companyUserId) {
    throw new Error("PROPOSAL_NOT_FOUND");
  }
  if (
    proposal.status !== "INTERESTED" &&
    proposal.status !== "INTERVIEW_PENDING" &&
    proposal.status !== "INTERVIEW_CONFIRMED" &&
    proposal.status !== "INTERVIEW_CANCELLED"
  ) {
    throw new Error("PROPOSAL_NOT_SCHEDULABLE");
  }
  if (input.locationType === "ONLINE" && !String(input.meetingUrl || "").trim()) {
    throw new Error("MEETING_URL_REQUIRED");
  }
  if (input.locationType === "PRESENTIAL" && !String(input.address || "").trim()) {
    throw new Error("ADDRESS_REQUIRED");
  }
  if (
    input.locationType !== "ONLINE" &&
    input.locationType !== "PRESENTIAL" &&
    input.locationType !== "PLATFORM"
  ) {
    throw new Error("INVALID_LOCATION_TYPE");
  }

  const interviewId = proposal.interview?.id || randomUUID();
  const addressVal = input.locationType === "PRESENTIAL" ? input.address || null : null;
  const meetingVal = input.locationType === "ONLINE" ? input.meetingUrl || null : null;
  if (proposal.interview?.id) {
    await prisma.$executeRaw`
      UPDATE "JobInterview"
      SET "scheduledAt" = ${input.scheduledAt},
          "locationType" = ${input.locationType},
          address = ${addressVal},
          "meetingUrl" = ${meetingVal},
          observacoes = ${input.observacoes.trim()},
          status = 'PENDING',
          "updatedAt" = NOW()
      WHERE id = ${interviewId}
    `;
  } else {
    await prisma.$executeRaw`
      INSERT INTO "JobInterview" (
        id, "proposalId", "scheduledAt", "locationType",
        address, "meetingUrl", observacoes, status, "createdAt", "updatedAt"
      ) VALUES (
        ${interviewId}, ${input.proposalId}, ${input.scheduledAt}, ${input.locationType},
        ${addressVal},
        ${meetingVal},
        ${input.observacoes.trim()}, 'PENDING', NOW(), NOW()
      )
    `;
  }

  await prisma.$executeRaw`
    UPDATE "JobProposal"
    SET status = 'INTERVIEW_PENDING', "updatedAt" = NOW()
    WHERE id = ${input.proposalId}
  `;

  await upsertCompanyProfileTracking(input.companyUserId, proposal.profileId, {
    entrevistaCancelada: false,
  });

  const updated = await getProposalById(input.proposalId);
  if (!updated) throw new Error("PROPOSAL_NOT_FOUND");
  return updated;
}

export async function cancelInterview(input: {
  proposalId: string;
  companyUserId?: string;
  profileId?: string;
  justification: string;
}): Promise<JobProposalDTO> {
  await ensureJobProposalTables();
  const proposal = await getProposalById(input.proposalId);
  if (!proposal) throw new Error("PROPOSAL_NOT_FOUND");
  if (input.companyUserId && proposal.companyUserId !== input.companyUserId) {
    throw new Error("PROPOSAL_NOT_FOUND");
  }
  if (input.profileId && proposal.profileId !== input.profileId) {
    throw new Error("PROPOSAL_NOT_FOUND");
  }
  if (!proposal.interview) {
    throw new Error("INTERVIEW_NOT_FOUND");
  }
  if (
    proposal.status !== "INTERVIEW_PENDING" &&
    proposal.status !== "INTERVIEW_CONFIRMED"
  ) {
    throw new Error("INTERVIEW_NOT_CANCELLABLE");
  }

  const justification = String(input.justification || "").trim().slice(0, 1000);
  const prevObs = String(proposal.interview.observacoes || "").trim();
  const observacoes = justification
    ? prevObs
      ? `${prevObs}\n\nCancelamento: ${justification}`
      : `Cancelamento: ${justification}`
    : prevObs || "Entrevista cancelada";

  await prisma.$executeRaw`
    UPDATE "JobInterview"
    SET status = 'CANCELLED',
        observacoes = ${observacoes},
        "updatedAt" = NOW()
    WHERE "proposalId" = ${input.proposalId}
  `;
  await prisma.$executeRaw`
    UPDATE "JobProposal"
    SET status = 'INTERVIEW_CANCELLED', "updatedAt" = NOW()
    WHERE id = ${input.proposalId}
  `;

  await upsertCompanyProfileTracking(proposal.companyUserId, proposal.profileId, {
    entrevistaCancelada: true,
  });

  const updated = await getProposalById(input.proposalId);
  if (!updated) throw new Error("PROPOSAL_NOT_FOUND");
  return updated;
}

export async function respondToInterview(
  proposalId: string,
  profileId: string,
  action: "CONFIRM" | "DECLINE",
): Promise<JobProposalDTO> {
  await ensureJobProposalTables();
  const proposal = await getProposalById(proposalId);
  if (!proposal || proposal.profileId !== profileId) {
    throw new Error("PROPOSAL_NOT_FOUND");
  }
  if (proposal.status !== "INTERVIEW_PENDING" || !proposal.interview) {
    throw new Error("INTERVIEW_NOT_PENDING");
  }

  const interviewStatus: InterviewStatus = action === "CONFIRM" ? "CONFIRMED" : "DECLINED";
  const proposalStatus: ProposalStatus =
    action === "CONFIRM" ? "INTERVIEW_CONFIRMED" : "INTERVIEW_DECLINED";

  await prisma.$executeRaw`
    UPDATE "JobInterview"
    SET status = ${interviewStatus}, "updatedAt" = NOW()
    WHERE "proposalId" = ${proposalId}
  `;
  await prisma.$executeRaw`
    UPDATE "JobProposal"
    SET status = ${proposalStatus}, "updatedAt" = NOW()
    WHERE id = ${proposalId}
  `;

  if (action === "CONFIRM") {
    await upsertCompanyProfileTracking(proposal.companyUserId, profileId, {
      contatado: true,
      entrevistado: true,
    });
  }

  const updated = await getProposalById(proposalId);
  if (!updated) throw new Error("PROPOSAL_NOT_FOUND");
  return updated;
}
