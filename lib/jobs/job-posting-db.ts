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
  parseJobWrite,
  toAdminJob,
  toPublicJob,
} from "@/lib/jobs/job-posting";
import { resolveResumeLink, sendJobApplicationEmail } from "@/lib/jobs/job-application-mail";

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
    data: writeData(data, current),
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
    data: writeData(data, current),
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

export async function listPublicJobs(): Promise<PublicJob[]> {
  const rows = await prisma.jobPosting.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publicationDate: "desc" }, { createdAt: "desc" }],
  });
  return rows.map((row) => toPublicJob(asRecord(row)));
}

export async function getPublicJob(id: string): Promise<PublicJob | null> {
  const jobId = assertJobId(id);
  const row = await prisma.jobPosting.findFirst({
    where: { id: jobId, status: "PUBLISHED" },
  });
  if (!row) return null;
  return toPublicJob(asRecord(row));
}

export type ApplicationView = {
  id: string;
  jobId: string;
  userId: string;
  profileId: string | null;
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
    select: { createdAt: true },
  });

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
      companyName: true,
      confidential: true,
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

    const alreadySent = await prisma.jobApplication.findUnique({
      where: { jobId_userId: { jobId: id, userId: user.id } },
      select: { id: true },
    });
    if (alreadySent) {
      throw new JobPostingError("Você já enviou sua candidatura para esta vaga.", 409);
    }

    const resumeUrl = await resolveResumeLink(user.profile?.curricoURL);
    const sent = await sendJobApplicationEmail({
      to: job.applicationEmail,
      jobTitle: job.title,
      confidential: job.confidential,
      companyName: job.companyName,
      professionalName: user.name,
      professionalEmail: user.email,
      profileTitle: user.profile?.title ?? null,
      resumeUrl,
    });
    if (!sent.ok) {
      throw new JobPostingError(sent.error, 502);
    }
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
      message: job.applicationMode === "EMAIL"
        ? "Candidatura enviada para o e-mail da empresa."
        : "Candidatura registrada.",
    };
  } catch (error) {
    if (error instanceof JobPostingError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new JobPostingError("Você já registrou candidatura nesta vaga.", 409);
    }
    throw error;
  }
}
