import { prisma } from "@/lib/db";
import { ensureJobFavoritesTable } from "@/lib/infra/ensure-db-schema";
import { assertJobId, type PublicJob } from "@/lib/jobs/job-posting";
import { asPublicJob } from "@/lib/jobs/job-posting-db";

/** Vagas publicadas que o profissional guardou, da mais recente para a mais antiga. */
export async function listFavoriteJobs(userId: string): Promise<PublicJob[]> {
  await ensureJobFavoritesTable();
  const rows = await prisma.jobFavorite.findMany({
    where: { userId, job: { status: "PUBLISHED" } },
    orderBy: { createdAt: "desc" },
    include: { job: true },
  });
  return rows.map((row) => asPublicJob(row.job));
}

export async function listFavoriteJobIds(userId: string): Promise<string[]> {
  await ensureJobFavoritesTable();
  const rows = await prisma.jobFavorite.findMany({
    where: { userId },
    select: { jobId: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => row.jobId);
}

export async function isFavoriteJob(userId: string, jobId: string): Promise<boolean> {
  await ensureJobFavoritesTable();
  const id = assertJobId(jobId);
  const row = await prisma.jobFavorite.findUnique({
    where: { userId_jobId: { userId, jobId: id } },
    select: { id: true },
  });
  return Boolean(row);
}

/** Marca ou tira a vaga dos favoritos. Só vaga publicada entra. */
export async function setFavoriteJob(userId: string, jobId: string, favorited: boolean): Promise<boolean> {
  await ensureJobFavoritesTable();
  const id = assertJobId(jobId);
  const job = await prisma.jobPosting.findFirst({
    where: { id, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!job) {
    if (!favorited) {
      await prisma.jobFavorite.deleteMany({ where: { userId, jobId: id } });
    }
    return false;
  }
  if (favorited) {
    await prisma.jobFavorite.upsert({
      where: { userId_jobId: { userId, jobId: id } },
      create: { userId, jobId: id },
      update: {},
    });
    return true;
  }
  await prisma.jobFavorite.deleteMany({ where: { userId, jobId: id } });
  return false;
}
