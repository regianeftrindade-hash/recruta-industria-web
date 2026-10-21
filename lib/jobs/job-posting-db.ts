import type { JobPosting } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  type AdminJob,
  type JobRecord,
  type JobStatus,
  type JobWriteData,
  type PublicJob,
  JobPostingError,
  assertJobId,
  companyCanReadJobApplications,
  isProfessionalAccount,
  parseApplicationStage,
  parseJobWrite,
  toAdminJob,
  toPublicJob,
} from "@/lib/jobs/job-posting";
import {
  APPLICATION_EMAIL_SUCCESS,
  loadOwnedResumePdf,
  sendJobApplicationEmail,
} from "@/lib/jobs/job-application-mail";
import { parseJobSearch, publicJobWhere, type JobSearchFilters } from "@/lib/jobs/job-search";

function asRecord(job: JobPosting, applicationCount = 0): JobRecord {
  return {
    id: job.id,
    companyName: job.companyName,
    confidential: job.confidential,
    publicationDate: job.publicationDate,
    title: job.title,
    salaryCents: job.salaryCents,
    salaryNegotiable: job.salaryNegotiable,
    contractType: job.contractType,
    contractTypeOther: job.contractTypeOther,
    workMode: job.workMode,
    workplace: job.workplace,
    description: job.description,
    observations: job.observations,
    applicationInstructions: job.applicationInstructions,
    applicationMode: job.applicationMode,
    externalApplyUrl: job.externalApplyUrl,
    applicationEmail: job.applicationEmail,
    status: job.status,
    origin: job.origin,
    companyUserId: job.companyUserId,
    publishedAt: job.publishedAt,
    closedAt: job.closedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    applicationCount,
  };
}

function statusTimestamps(status: JobStatus, current?: { publishedAt: Date | null; closedAt: Date | null }) {
  const now = new Date();
  if (status === "PUBLISHED") {
    return {
      publishedAt: current?.publishedAt ?? now,
      closedAt: null,
    };
  }
  if (status === "CLOSED") {
    return {
      publishedAt: current?.publishedAt ?? null,
      closedAt: current?.closedAt ?? now,
    };
  }
  return {
    publishedAt: current?.publishedAt ?? null,
    closedAt: null,
  };
}

function jobDataForUpdate(
  input: unknown,
  data: JobWriteData,
  current?: { publishedAt: Date | null; closedAt: Date | null },
) {
  const payload = writeData(data, current);
  if (!input || typeof input !== "object" || Array.isArray(input)) return payload;
  const { workplace, applicationInstructions, ...rest } = payload;
  return {
    ...rest,
    ...("workplace" in input ? { workplace } : {}),
    ...("applicationInstructions" in input ? { applicationInstructions } : {}),
  };
}

function writeData(data: JobWriteData, current?: { publishedAt: Date | null; closedAt: Date | null }) {
  return {
    companyName: data.companyName,
    confidential: data.confidential,
    publicationDate: data.publicationDate,
    title: data.title,
    salaryCents: data.salaryCents,
    salaryNegotiable: data.salaryNegotiable,
    contractType: data.contractType,
    contractTypeOther: data.contractTypeOther,
    workMode: data.workMode,
    workplace: data.workplace,
    description: data.description,
    observations: data.observations,
    applicationInstructions: data.applicationInstructions,
    applicationMode: data.applicationMode,
    externalApplyUrl: data.externalApplyUrl,
    applicationEmail: data.applicationEmail,
    status: data.status,
    ...statusTimestamps(data.status, current),
  };
}

export async function listAdminJobs(): Promise<AdminJob[]> {
  const rows = await prisma.jobPosting.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: { _count: { select: { applications: true } } },
  });

  return rows.map((row) => toAdminJob(asRecord(row, row._count.applications)));
}

export async function createAdminJob(createdByUserId: string, input: unknown): Promise<AdminJob> {
  const data = parseJobWrite(input);
  const created = await prisma.jobPosting.create({
    data: {
      ...writeData(data),
      origin: "ADMIN",
      companyUserId: null,
      createdByUserId,
    },
  });
  const saved = await prisma.jobPosting.findUnique({ where: { id: created.id } });
  if (!saved) {
    throw new JobPostingError("A vaga não foi confirmada no banco de dados.", 500);
  }
  return toAdminJob(asRecord(saved, 0));
}

export async function updateAdminJob(id: string, input: unknown): Promise<AdminJob> {
  const jobId = assertJobId(id);
  const current = await prisma.jobPosting.findUnique({ where: { id: jobId } });
  if (!current) {
    throw new JobPostingError("Vaga não encontrada.", 404);
  }

  const data = parseJobWrite(input);
  await prisma.jobPosting.update({
    where: { id: jobId },
    data: jobDataForUpdate(input, data, current),
  });

  const saved = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    include: { _count: { select: { applications: true } } },
  });
  if (!saved) {
    throw new JobPostingError("A alteração da vaga não foi confirmada no banco de dados.", 500);
  }
  return toAdminJob(asRecord(saved, saved._count.applications));
}

export async function listCompanyJobs(companyOwnerUserId: string): Promise<AdminJob[]> {
  const rows = await prisma.jobPosting.findMany({
    where: { companyUserId: companyOwnerUserId },
    orderBy: [{ updatedAt: "desc" }],
    include: { _count: { select: { applications: true } } },
  });
  return rows.map((row) => toAdminJob(asRecord(row, row._count.applications)));
}

export async function createCompanyJob(
  companyOwnerUserId: string,
  createdByUserId: string,
  input: unknown,
): Promise<AdminJob> {
  const data = parseJobWrite(input);
  const created = await prisma.jobPosting.create({
    data: {
      ...writeData(data),
      origin: "COMPANY",
      companyUserId: companyOwnerUserId,
      createdByUserId,
    },
  });
  const saved = await prisma.jobPosting.findUnique({ where: { id: created.id } });
  if (!saved) {
    throw new JobPostingError("A vaga não foi confirmada no banco de dados.", 500);
  }
  return toAdminJob(asRecord(saved, 0));
}

export async function updateCompanyJob(
  companyOwnerUserId: string,
  id: string,
  input: unknown,
): Promise<AdminJob> {
  const jobId = assertJobId(id);
  const current = await prisma.jobPosting.findUnique({ where: { id: jobId } });
  if (!current || current.companyUserId !== companyOwnerUserId) {
    throw new JobPostingError("Você não pode alterar esta vaga.", 403);
  }

  const data = parseJobWrite(input);
  await prisma.jobPosting.update({
    where: { id: jobId },
    data: jobDataForUpdate(input, data, current),
  });

  const saved = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    include: { _count: { select: { applications: true } } },
  });
  if (!saved) {
    throw new JobPostingError("A alteração da vaga não foi confirmada no banco de dados.", 500);
  }
  return toAdminJob(asRecord(saved, saved._count.applications));
}

export async function deleteCompanyJob(companyOwnerUserId: string, id: string): Promise<void> {
  const jobId = assertJobId(id);
  const current = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    select: { companyUserId: true, _count: { select: { applications: true } } },
  });
  if (!current || current.companyUserId !== companyOwnerUserId) {
    throw new JobPostingError("Você não pode excluir esta vaga.", 403);
  }
  if (current._count.applications > 0) {
    throw new JobPostingError(
      "Esta vaga tem candidaturas e não pode ser excluída. Encerre a vaga para manter o histórico. Os candidatos não serão apagados.",
      409,
    );
  }

  await prisma.jobPosting.delete({ where: { id: jobId } });
  const stillThere = await prisma.jobPosting.findUnique({ where: { id: jobId }, select: { id: true } });
  if (stillThere) {
    throw new JobPostingError("A exclusão da vaga não foi confirmada no banco de dados.", 500);
  }
}

export async function deleteAdminJob(id: string): Promise<void> {
  const jobId = assertJobId(id);
  const current = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    select: { id: true, _count: { select: { applications: true } } },
  });
  if (!current) {
    throw new JobPostingError("Vaga não encontrada.", 404);
  }
  if (current._count.applications > 0) {
    throw new JobPostingError(
      "Esta vaga tem candidaturas e não pode ser excluída. Encerre a vaga para manter o histórico. Os candidatos não serão apagados.",
      409,
    );
  }

  await prisma.jobPosting.delete({ where: { id: jobId } });
  const stillThere = await prisma.jobPosting.findUnique({ where: { id: jobId }, select: { id: true } });
  if (stillThere) {
    throw new JobPostingError("A exclusão da vaga não foi confirmada no banco de dados.", 500);
  }
}

export async function updateCompanyApplicationStage(
  companyOwnerUserId: string,
  jobId: string,
  applicationId: string,
  stage: unknown,
): Promise<{ id: string; stage: string }> {
  const id = assertJobId(jobId);
  const nextStage = parseApplicationStage(stage);
  if (!/^[a-z0-9]{8,40}$/i.test(applicationId)) {
    throw new JobPostingError("Candidatura não encontrada.", 404);
  }

  const job = await prisma.jobPosting.findUnique({
    where: { id },
    select: { companyUserId: true },
  });
  if (!job || !companyCanReadJobApplications(job, companyOwnerUserId)) {
    throw new JobPostingError("Você não pode alterar as candidaturas desta vaga.", 403);
  }

  const updated = await prisma.jobApplication.updateMany({
    where: { id: applicationId, jobId: id },
    data: { stage: nextStage },
  });
  if (updated.count !== 1) {
    throw new JobPostingError("Candidatura não encontrada.", 404);
  }

  const saved = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, stage: true, jobId: true },
  });
  if (!saved || saved.stage !== nextStage || saved.jobId !== id) {
    throw new JobPostingError("A etapa não foi confirmada no banco de dados.", 500);
  }
  return { id: saved.id, stage: saved.stage };
}

export async function updateAdminApplicationStage(
  jobId: string,
  applicationId: string,
  stage: unknown,
): Promise<{ id: string; stage: string }> {
  const id = assertJobId(jobId);
  const nextStage = parseApplicationStage(stage);
  if (!/^[a-z0-9]{8,40}$/i.test(applicationId)) {
    throw new JobPostingError("Candidatura não encontrada.", 404);
  }

  const job = await prisma.jobPosting.findUnique({ where: { id }, select: { id: true } });
  if (!job) throw new JobPostingError("Vaga não encontrada.", 404);

  const updated = await prisma.jobApplication.updateMany({
    where: { id: applicationId, jobId: id },
    data: { stage: nextStage },
  });
  if (updated.count !== 1) {
    throw new JobPostingError("Candidatura não encontrada.", 404);
  }

  const saved = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, stage: true, jobId: true },
  });
  if (!saved || saved.stage !== nextStage || saved.jobId !== id) {
    throw new JobPostingError("A etapa não foi confirmada no banco de dados.", 500);
  }
  return { id: saved.id, stage: saved.stage };
}

export async function searchPublicJobs(filters: JobSearchFilters): Promise<PublicJob[]> {
  const rows = await prisma.jobPosting.findMany({
    where: publicJobWhere(filters),
    orderBy: [{ publicationDate: "desc" }, { createdAt: "desc" }],
  });
  return rows.map((row) => toPublicJob(asRecord(row)));
}

export async function listPublicJobs(): Promise<PublicJob[]> {
  return searchPublicJobs(parseJobSearch({}));
}

export async function getPublicJob(id: string): Promise<PublicJob | null> {
  const jobId = assertJobId(id);
  const row = await prisma.jobPosting.findFirst({
    where: { id: jobId, status: "PUBLISHED" },
  });
  if (!row) return null;
  return toPublicJob(asRecord(row));
}

export type PublicJobView =
  | { availability: "open"; job: PublicJob }
  | { availability: "unavailable"; title: string };

export async function getPublicJobView(id: string): Promise<PublicJobView | null> {
  const jobId = assertJobId(id);
  const row = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    select: { status: true, title: true },
  });
  if (!row || row.status === "DRAFT") return null;
  if (row.status !== "PUBLISHED") {
    return { availability: "unavailable", title: row.title };
  }
  const job = await getPublicJob(jobId);
  if (!job) return { availability: "unavailable", title: row.title };
  return { availability: "open", job };
}

export type ApplicationView = {
  id: string;
  jobId: string;
  userId: string;
  profileId: string | null;
  stage: string;
  createdAt: string;
  name: string | null;
  email: string;
  profileTitle: string | null;
};

export async function listJobApplicationsForAdmin(jobId: string): Promise<ApplicationView[]> {
  const id = assertJobId(jobId);
  const job = await prisma.jobPosting.findUnique({ where: { id }, select: { id: true } });
  if (!job) throw new JobPostingError("Vaga não encontrada.", 404);

  const rows = await prisma.jobApplication.findMany({
    where: { jobId: id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      profile: { select: { id: true, title: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    jobId: row.jobId,
    userId: row.userId,
    profileId: row.profileId,
    stage: row.stage,
    createdAt: row.createdAt.toISOString(),
    name: row.user.name,
    email: row.user.email,
    profileTitle: row.profile?.title ?? null,
  }));
}

export async function listJobApplicationsForCompany(
  jobId: string,
  companyOwnerUserId: string,
): Promise<ApplicationView[]> {
  const id = assertJobId(jobId);
  const job = await prisma.jobPosting.findUnique({
    where: { id },
    select: { id: true, companyUserId: true },
  });
  if (!job || !companyCanReadJobApplications(job, companyOwnerUserId)) {
    throw new JobPostingError("Você não pode consultar as candidaturas desta vaga.", 403);
  }
  return listJobApplicationsForAdmin(id);
}

export type OwnApplicationState = {
  authenticated: boolean;
  applied: boolean;
  appliedAt: string | null;
  canApply: boolean;
  blockReason: string | null;
};

export async function getOwnApplicationState(jobId: string, email: string | null): Promise<OwnApplicationState> {
  const id = assertJobId(jobId);
  const open = await prisma.jobPosting.findFirst({
    where: { id, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!open) throw new JobPostingError("Vaga não encontrada.", 404);

  if (!email) {
    return {
      authenticated: false,
      applied: false,
      appliedAt: null,
      canApply: true,
      blockReason: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      professional: { select: { id: true } },
      company: { select: { id: true } },
    },
  });

  if (!user) {
    return {
      authenticated: false,
      applied: false,
      appliedAt: null,
      canApply: true,
      blockReason: null,
    };
  }

  if (!isProfessionalAccount({
    role: user.role,
    hasProfessional: Boolean(user.professional),
    hasCompany: Boolean(user.company),
  })) {
    return {
      authenticated: true,
      applied: false,
      appliedAt: null,
      canApply: false,
      blockReason: "A candidatura é feita com uma conta de profissional.",
    };
  }

  const existing = await prisma.jobApplication.findUnique({
    where: { jobId_userId: { jobId: id, userId: user.id } },
    select: { createdAt: true, emailStatus: true },
  });

  if (existing?.emailStatus === "FAILED") {
    return {
      authenticated: true,
      applied: false,
      appliedAt: null,
      canApply: true,
      blockReason: null,
    };
  }

  if (existing?.emailStatus === "PENDING") {
    return {
      authenticated: true,
      applied: false,
      appliedAt: null,
      canApply: false,
      blockReason: "O envio desta candidatura já está em andamento.",
    };
  }

  if (existing) {
    return {
      authenticated: true,
      applied: true,
      appliedAt: existing.createdAt.toISOString(),
      canApply: false,
      blockReason: null,
    };
  }

  return {
    authenticated: true,
    applied: false,
    appliedAt: null,
    canApply: true,
    blockReason: null,
  };
}

const EMAIL_CLAIM_MS = 2 * 60 * 1000;

async function claimEmailApplication(
  jobId: string,
  userId: string,
  profileId: string | null,
): Promise<"send" | "already" | "busy"> {
  const existing = await prisma.jobApplication.findUnique({
    where: { jobId_userId: { jobId, userId } },
    select: { id: true, emailStatus: true, emailAttemptAt: true },
  });

  if (existing && (existing.emailStatus === "SENT" || existing.emailStatus == null)) {
    return "already";
  }

  const now = new Date();
  const staleBefore = new Date(now.getTime() - EMAIL_CLAIM_MS);

  if (!existing) {
    try {
      await prisma.jobApplication.create({
        data: {
          jobId,
          userId,
          profileId,
          emailStatus: "PENDING",
          emailAttemptAt: now,
        },
      });
      return "send";
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return "busy";
      }
      throw error;
    }
  }

  if (existing.emailStatus === "FAILED") {
    const claimed = await prisma.jobApplication.updateMany({
      where: { id: existing.id, emailStatus: "FAILED" },
      data: { emailStatus: "PENDING", emailAttemptAt: now, profileId },
    });
    return claimed.count === 1 ? "send" : "busy";
  }

  const pendingIsStale = existing.emailStatus === "PENDING"
    && (!existing.emailAttemptAt || existing.emailAttemptAt < staleBefore);
  if (!pendingIsStale) return "busy";

  const claimed = await prisma.jobApplication.updateMany({
    where: {
      id: existing.id,
      emailStatus: "PENDING",
      OR: [{ emailAttemptAt: null }, { emailAttemptAt: { lt: staleBefore } }],
    },
    data: { emailStatus: "PENDING", emailAttemptAt: now, profileId },
  });
  return claimed.count === 1 ? "send" : "busy";
}

export async function registerJobApplication(jobId: string, email: string) {
  const id = assertJobId(jobId);
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      professional: { select: { id: true } },
      company: { select: { id: true } },
      profile: { select: { id: true, title: true, curricoURL: true } },
    },
  });

  if (!user) {
    throw new JobPostingError("Entre com uma conta de profissional para se candidatar.", 401);
  }

  if (!isProfessionalAccount({
    role: user.role,
    hasProfessional: Boolean(user.professional),
    hasCompany: Boolean(user.company),
  })) {
    throw new JobPostingError("A candidatura é feita com uma conta de profissional.", 403);
  }

  const job = await prisma.jobPosting.findFirst({
    where: { id, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      applicationMode: true,
      applicationEmail: true,
    },
  });
  if (!job) {
    throw new JobPostingError("Esta vaga não está aberta para candidatura.", 404);
  }

  if (job.applicationMode === "EXTERNAL") {
    throw new JobPostingError("Esta vaga recebe a candidatura no site da empresa.", 400);
  }

  if (job.applicationMode === "EMAIL") {
    if (!job.applicationEmail) {
      throw new JobPostingError("Esta vaga não tem e-mail para receber candidaturas.", 400);
    }

    const resume = await loadOwnedResumePdf(user.email, user.profile?.curricoURL);
    const claim = await claimEmailApplication(id, user.id, user.profile?.id ?? null);
    if (claim === "already") {
      throw new JobPostingError("Você já enviou sua candidatura para esta vaga.", 409, "ALREADY_APPLIED");
    }
    if (claim === "busy") {
      throw new JobPostingError("O envio desta candidatura já está em andamento.", 409, "EMAIL_BUSY");
    }

    const sent = await sendJobApplicationEmail({
      to: job.applicationEmail,
      jobTitle: job.title,
      professionalName: user.name,
      professionalEmail: user.email,
      resume,
    });
    if (!sent.ok) {
      await prisma.jobApplication.updateMany({
        where: { jobId: id, userId: user.id, emailStatus: "PENDING" },
        data: { emailStatus: "FAILED" },
      });
      throw new JobPostingError(sent.error, 502);
    }

    await prisma.jobApplication.updateMany({
      where: { jobId: id, userId: user.id },
      data: { emailStatus: "SENT", profileId: user.profile?.id ?? null },
    });

    const saved = await prisma.jobApplication.findUnique({
      where: { jobId_userId: { jobId: id, userId: user.id } },
      select: { id: true, jobId: true, userId: true, profileId: true, createdAt: true, emailStatus: true },
    });
    if (!saved || saved.userId !== user.id || saved.jobId !== id || saved.emailStatus !== "SENT") {
      throw new JobPostingError("A candidatura não foi confirmada no banco de dados.", 500);
    }
    return {
      id: saved.id,
      jobId: saved.jobId,
      userId: saved.userId,
      profileId: saved.profileId,
      createdAt: saved.createdAt.toISOString(),
      message: APPLICATION_EMAIL_SUCCESS,
    };
  }

  try {
    const created = await prisma.jobApplication.create({
      data: {
        jobId: id,
        userId: user.id,
        profileId: user.profile?.id ?? null,
      },
    });

    const saved = await prisma.jobApplication.findUnique({
      where: { id: created.id },
      select: { id: true, jobId: true, userId: true, profileId: true, createdAt: true },
    });
    if (!saved || saved.userId !== user.id || saved.jobId !== id) {
      throw new JobPostingError("A candidatura não foi confirmada no banco de dados.", 500);
    }

    return {
      id: saved.id,
      jobId: saved.jobId,
      userId: saved.userId,
      profileId: saved.profileId,
      createdAt: saved.createdAt.toISOString(),
      message: "Candidatura registrada.",
    };
  } catch (error) {
    if (error instanceof JobPostingError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new JobPostingError("Você já registrou candidatura nesta vaga.", 409);
    }
    throw error;
  }
}
