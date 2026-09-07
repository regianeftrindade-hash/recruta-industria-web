import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { resolveCompanyActor } from "@/lib/company/company-team";
import { applyCollaborationSchema } from "@/lib/infra/ensure-db-schema";

export type ProfileFeedbackDTO = {
  id: string;
  profileId: string;
  authorUserId: string;
  authorName: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

type FeedbackRow = {
  id: string;
  companyOwnerUserId: string;
  profileId: string;
  authorUserId: string;
  authorName: string;
  body: string;
  createdAt: Date;
};

let feedbackTableReady = false;

export async function ensureCompanyProfileFeedbackTable(): Promise<void> {
  if (feedbackTableReady) return;
  await applyCollaborationSchema();
  feedbackTableReady = true;
}

/** Lista feedbacks da equipe (mesma assinatura) sobre um candidato. */
export async function listProfileFeedbacks(
  userId: string,
  profileId: string,
): Promise<ProfileFeedbackDTO[]> {
  await ensureCompanyProfileFeedbackTable();

  const actor = await resolveCompanyActor(userId);
  if (!actor) return [];

  const rows = await prisma.$queryRaw<FeedbackRow[]>`
    SELECT * FROM "CompanyProfileFeedback"
    WHERE "companyOwnerUserId" = ${actor.ownerUserId}
      AND "profileId" = ${profileId}
    ORDER BY "createdAt" DESC
    LIMIT 100
  `;

  return rows.map((row) => ({
    id: row.id,
    profileId: row.profileId,
    authorUserId: row.authorUserId,
    authorName: row.authorName,
    body: row.body,
    createdAt: new Date(row.createdAt).toISOString(),
    mine: row.authorUserId === userId,
  }));
}

/** Registra o feedback de um membro da equipe sobre um candidato. */
export async function addProfileFeedback(input: {
  userId: string;
  profileId: string;
  body: string;
}): Promise<ProfileFeedbackDTO[]> {
  await ensureCompanyProfileFeedbackTable();

  const actor = await resolveCompanyActor(input.userId);
  if (!actor) throw new Error("FORBIDDEN");

  const body = input.body.trim().slice(0, 1000);
  if (!body) throw new Error("EMPTY_BODY");

  const author = await prisma.user.findUnique({
    where: { id: input.userId },
    include: { company: true },
  });
  const authorName =
    author?.company?.responsavelNome || author?.name || author?.email || "Colega do RH";

  await prisma.$executeRaw`
    INSERT INTO "CompanyProfileFeedback" (
      id, "companyOwnerUserId", "profileId", "authorUserId", "authorName", body, "createdAt"
    ) VALUES (
      ${randomUUID()}, ${actor.ownerUserId}, ${input.profileId}, ${input.userId}, ${authorName}, ${body}, NOW()
    )
  `;

  return listProfileFeedbacks(input.userId, input.profileId);
}

/** Só o autor pode excluir o próprio feedback. */
export async function deleteProfileFeedback(input: {
  userId: string;
  feedbackId: string;
}): Promise<{ profileId: string }> {
  await ensureCompanyProfileFeedbackTable();

  const actor = await resolveCompanyActor(input.userId);
  if (!actor) throw new Error("FORBIDDEN");

  const rows = await prisma.$queryRaw<FeedbackRow[]>`
    SELECT * FROM "CompanyProfileFeedback"
    WHERE id = ${input.feedbackId}
      AND "companyOwnerUserId" = ${actor.ownerUserId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) throw new Error("NOT_FOUND");
  if (row.authorUserId !== input.userId) throw new Error("FORBIDDEN");

  await prisma.$executeRaw`
    DELETE FROM "CompanyProfileFeedback"
    WHERE id = ${input.feedbackId}
      AND "authorUserId" = ${input.userId}
      AND "companyOwnerUserId" = ${actor.ownerUserId}
  `;

  return { profileId: row.profileId };
}
