import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { isRuntimeDdlEnabled } from "@/lib/infra/ensure-db-schema";

export type InterviewRatingDTO = {
  id: string;
  callId: string | null;
  companyUserId: string;
  profileId: string;
  professionalName: string;
  rating: number;
  reason: string;
  createdAt: string;
};

/** Rating inteiro 1–5; rejeita 0/6/NaN. */
export function parseInterviewRating(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new Error("INVALID_RATING");
  }
  return n;
}

let ratingTableReady = false;

export async function ensureInterviewRatingTable(): Promise<void> {
  if (ratingTableReady) return;
  if (!isRuntimeDdlEnabled()) {
    ratingTableReady = true;
    return;
  }
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "InterviewRating" (
      "id" TEXT NOT NULL,
      "callId" TEXT,
      "companyUserId" TEXT NOT NULL,
      "profileId" TEXT NOT NULL,
      "rating" INTEGER NOT NULL,
      "reason" TEXT NOT NULL DEFAULT '',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "InterviewRating_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "InterviewRating_companyUserId_idx" ON "InterviewRating"("companyUserId")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "InterviewRating_callId_key" ON "InterviewRating"("callId") WHERE "callId" IS NOT NULL`,
  );
  ratingTableReady = true;
}

export async function createInterviewRating(input: {
  callId: string | null;
  companyUserId: string;
  profileId: string;
  rating: number;
  reason: string;
}): Promise<string> {
  await ensureInterviewRatingTable();
  const rating = parseInterviewRating(input.rating);

  if (input.callId) {
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "InterviewRating" WHERE "callId" = ${input.callId} LIMIT 1
    `;
    if (existing[0]) throw new Error("ALREADY_RATED");
  }

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "InterviewRating" (
      id, "callId", "companyUserId", "profileId", rating, reason, "createdAt"
    ) VALUES (
      ${id}, ${input.callId}, ${input.companyUserId}, ${input.profileId},
      ${rating}, ${input.reason}, NOW()
    )
  `;
  return id;
}

/** Avaliações recebidas pela empresa (confidenciais — só a própria empresa vê). */
export async function listInterviewRatingsForCompany(
  companyUserId: string,
): Promise<InterviewRatingDTO[]> {
  await ensureInterviewRatingTable();
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      callId: string | null;
      companyUserId: string;
      profileId: string;
      rating: number;
      reason: string;
      createdAt: Date;
    }>
  >`
    SELECT id, "callId", "companyUserId", "profileId", rating, reason, "createdAt"
    FROM "InterviewRating"
    WHERE "companyUserId" = ${companyUserId}
    ORDER BY "createdAt" DESC
    LIMIT 100
  `;

  const profileIds = [...new Set(rows.map((r) => r.profileId))];
  const profiles = profileIds.length
    ? await prisma.profile.findMany({
        where: { id: { in: profileIds } },
        select: { id: true, user: { select: { name: true } } },
      })
    : [];
  const nameByProfileId = new Map(profiles.map((p) => [p.id, p.user?.name || "Profissional"]));

  return rows.map((r) => ({
    id: r.id,
    callId: r.callId,
    companyUserId: r.companyUserId,
    profileId: r.profileId,
    professionalName: nameByProfileId.get(r.profileId) || "Profissional",
    rating: r.rating,
    reason: r.reason,
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}
