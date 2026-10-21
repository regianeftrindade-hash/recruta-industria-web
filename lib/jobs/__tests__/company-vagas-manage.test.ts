import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

function loadEnvFile(filename: string) {
  const file = path.resolve(process.cwd(), filename);
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const canRun = Boolean(process.env.DATABASE_URL);

describe.skipIf(!canRun)("gestão de vagas da empresa", () => {
  const stamp = Date.now();
  const ownerEmail = `company-vagas-owner-${stamp}@example.invalid`;
  const otherEmail = `company-vagas-other-${stamp}@example.invalid`;
  const proEmail = `company-vagas-pro-${stamp}@example.invalid`;
  const createdUserIds: string[] = [];
  const createdJobIds: string[] = [];

  afterAll(async () => {
    if (!canRun) return;
    const { prisma } = await import("@/lib/infra/db");
    const users = await prisma.user.findMany({
      where: { email: { startsWith: "company-vagas-", endsWith: "@example.invalid" } },
      select: { id: true },
    });
    const userIds = [...new Set([...createdUserIds, ...users.map((user) => user.id)])];
    const jobs = userIds.length
      ? await prisma.jobPosting.findMany({
          where: { createdByUserId: { in: userIds } },
          select: { id: true },
        })
      : [];
    const jobIds = [...new Set([...createdJobIds, ...jobs.map((job) => job.id)])];
    if (jobIds.length || userIds.length) {
      await prisma.jobApplication.deleteMany({
        where: {
          OR: [
            ...(jobIds.length ? [{ jobId: { in: jobIds } }] : []),
            ...(userIds.length ? [{ userId: { in: userIds } }] : []),
          ],
        },
      });
    }
    if (jobIds.length) await prisma.jobPosting.deleteMany({ where: { id: { in: jobIds } } });
    if (userIds.length) await prisma.company.deleteMany({ where: { userId: { in: userIds } } });
    if (userIds.length) {
      await prisma.profile.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.professional.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  }, 30000);

  it("grava, pausa, reativa, muda a etapa e impede exclusão com candidatura", async () => {
    const { prisma } = await import("@/lib/infra/db");
    const db = await import("@/lib/jobs/job-posting-db");

    const owner = await prisma.user.create({
      data: { email: ownerEmail, name: "Empresa Dona", role: "COMPANY" },
    });
    const other = await prisma.user.create({
      data: { email: otherEmail, name: "Empresa Alheia", role: "COMPANY" },
    });
    const professional = await prisma.user.create({
      data: { email: proEmail, name: "Profissional Real", role: "PROFESSIONAL" },
    });
    createdUserIds.push(owner.id, other.id, professional.id);
    await prisma.company.create({ data: { userId: owner.id, name: "Indústria Teste Gestão" } });
    await prisma.company.create({ data: { userId: other.id, name: "Empresa Alheia Teste" } });
    const profile = await prisma.profile.create({
      data: { userId: professional.id, title: "Operador de CNC", location: "Joinville, SC" },
    });
    await prisma.professional.create({ data: { userId: professional.id, title: "Operador" } });

    const created = await db.createCompanyJob(owner.id, owner.id, {
      companyName: "Indústria Teste Gestão",
      confidential: false,
      publicationDate: "2026-10-21",
      title: "Auxiliar de Produção",
      salaryNegotiable: true,
      salary: "",
      contractType: "CLT",
      workMode: "PRESENCIAL",
      workplace: "Joinville/SC",
      description: "Acompanhar a linha de produção.",
      status: "PUBLISHED",
    });
    createdJobIds.push(created.id);
    expect(created.workplace).toBe("Joinville/SC");
    expect(created.id).toBeTruthy();

    const listed = await db.listCompanyJobs(owner.id);
    expect(listed.filter((job) => job.id === created.id)).toHaveLength(1);

    const edited = await db.updateCompanyJob(owner.id, created.id, {
      ...{
        companyName: created.companyName,
        confidential: false,
        publicationDate: "2026-10-21",
        title: "Auxiliar de Produção",
        salaryNegotiable: true,
        contractType: "CLT",
        workMode: "PRESENCIAL",
        workplace: "Joinville/SC",
        description: "Acompanhar a linha de produção no primeiro turno.",
        status: "PUBLISHED",
      },
    });
    expect(edited.id).toBe(created.id);
    expect(edited.description).toContain("primeiro turno");

    const application = await db.registerJobApplication(created.id, proEmail);
    expect(application.profileId).toBe(profile.id);
    const applications = await db.listJobApplicationsForCompany(created.id, owner.id);
    expect(applications).toHaveLength(1);
    expect(applications[0]?.stage).toBe("NEW");
    expect(applications[0]?.name).toBe("Profissional Real");

    await expect(db.updateCompanyApplicationStage(other.id, created.id, application.id, "REVIEW"))
      .rejects.toThrow(/não pode alterar/i);
    const stage = await db.updateCompanyApplicationStage(owner.id, created.id, application.id, "INTERVIEW");
    expect(stage.stage).toBe("INTERVIEW");
    const storedStage = await prisma.jobApplication.findUnique({ where: { id: application.id } });
    expect(storedStage?.stage).toBe("INTERVIEW");
    expect(storedStage?.jobId).toBe(created.id);

    await expect(db.deleteCompanyJob(owner.id, created.id)).rejects.toThrow(/candidaturas/i);
    const stillThere = await prisma.jobPosting.findUnique({ where: { id: created.id } });
    expect(stillThere).not.toBeNull();

    const paused = await db.updateCompanyJob(owner.id, created.id, {
      companyName: created.companyName,
      publicationDate: "2026-10-21",
      title: created.title,
      salaryNegotiable: true,
      contractType: "CLT",
      workMode: "PRESENCIAL",
      workplace: "Joinville/SC",
      description: edited.description,
      status: "UNPUBLISHED",
    });
    expect(paused.status).toBe("UNPUBLISHED");
    expect(await db.getPublicJob(created.id)).toBeNull();

    const reactivated = await db.updateCompanyJob(owner.id, created.id, {
      companyName: created.companyName,
      publicationDate: "2026-10-21",
      title: created.title,
      salaryNegotiable: true,
      contractType: "CLT",
      workMode: "PRESENCIAL",
      workplace: "Joinville/SC",
      description: edited.description,
      status: "PUBLISHED",
    });
    expect(reactivated.status).toBe("PUBLISHED");
    expect(reactivated.id).toBe(created.id);
    const publicJob = await db.getPublicJob(created.id);
    expect(publicJob?.title).toBe("Auxiliar de Produção");
    expect(publicJob?.workplace).toBe("Joinville/SC");
    expect(JSON.stringify(publicJob)).not.toContain("applicationEmail");

    const closed = await db.updateCompanyJob(owner.id, created.id, {
      companyName: created.companyName,
      publicationDate: "2026-10-21",
      title: created.title,
      salaryNegotiable: true,
      contractType: "CLT",
      workMode: "PRESENCIAL",
      workplace: "Joinville/SC",
      description: edited.description,
      status: "CLOSED",
    });
    expect(closed.status).toBe("CLOSED");
    expect(await db.getPublicJob(created.id)).toBeNull();
    expect(await prisma.jobApplication.count({ where: { jobId: created.id } })).toBe(1);
  }, 90000);
});
