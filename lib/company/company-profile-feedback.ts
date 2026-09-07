import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { resolveCompanyActor } from "@/lib/company/company-team";

export type ProfileFeedbackDTO = {
  id: string;
  profileId: string;
  authorUserId: string;
  authorName: string;
  body: string;
  createdAt: string;
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
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyProfileFeedback" (
      "id" TEXT NOT NULL,
      "companyOwnerUserId" TEXT NOT NULL,
      "profileId" TEXT NOT NULL,
      "authorUserId" TEXT NOT NULL,
      "authorName" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompanyProfileFeedback_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CompanyProfileFeedback_owner_profile_idx" ON "CompanyProfileFeedback"("companyOwnerUserId", "profileId", "createdAt")`,
  );
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
