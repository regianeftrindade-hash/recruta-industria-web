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

describe.skipIf(!canRun)("gravação de vagas e candidaturas", () => {
  const stamp = Date.now();
  const adminEmail = `job-posting-admin-${stamp}@example.invalid`;
  const proEmail = `job-posting-pro-${stamp}@example.invalid`;
  const otherEmail = `job-posting-other-${stamp}@example.invalid`;
  const companyEmail = `job-posting-company-${stamp}@example.invalid`;
  const createdUserIds: string[] = [];
  const createdJobIds: string[] = [];

  afterAll(async () => {
    if (!canRun) return;
    const { prisma } = await import("@/lib/infra/db");
    const leftovers = await prisma.user.findMany({
      where: {
        email: { startsWith: "job-posting-", endsWith: "@example.invalid" },
      },
      select: { id: true },
    });
    const userIds = [...new Set([...createdUserIds, ...leftovers.map((user) => user.id)])];
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
    if (jobIds.length) {
      await prisma.jobPosting.deleteMany({ where: { id: { in: jobIds } } });
    }
    if (userIds.length) {
      await prisma.profile.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.professional.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  }, 30000);

  it("publica, oculta dados confidenciais, grava a candidatura e mantém o vínculo após edição", async () => {
    const { prisma } = await import("@/lib/infra/db");
    const db = await import("@/lib/jobs/job-posting-db");

    const admin = await prisma.user.create({
      data: { email: adminEmail, name: "Admin Teste Vaga", role: "ADMIN" },
    });
    const professional = await prisma.user.create({
      data: { email: proEmail, name: "Profissional Teste Vaga", role: "PROFESSIONAL" },
    });
    const other = await prisma.user.create({
      data: { email: otherEmail, name: "Outro Profissional", role: "PROFESSIONAL" },
    });
    const companyUser = await prisma.user.create({
      data: { email: companyEmail, name: "Empresa Teste Vaga", role: "COMPANY" },
    });
    createdUserIds.push(admin.id, professional.id, other.id, companyUser.id);

    const profile = await prisma.profile.create({
      data: {
        userId: professional.id,
        title: "Operador de Máquinas",
        location: "Teste, TS",
      },
    });
    await prisma.professional.create({ data: { userId: professional.id, title: "Operador" } });

    const confidential = await db.createAdminJob(admin.id, {
      companyName: "MetalurgicaSigilosaXYZ",
      confidential: true,
      publicationDate: "2026-10-21",
      title: "Analista de Qualidade",
      salary: "",
      salaryNegotiable: true,
      contractType: "PJ",
      workMode: "HOME_OFFICE",
      description: "Acompanhar indicadores.\nRegistrar não conformidades.",
      observations: "",
      applicationInstructions: "Envie seu currículo para recrutamento@empresa.com.br.",
      status: "PUBLISHED",
    });
    createdJobIds.push(confidential.id);

    const openSalary = await db.createAdminJob(admin.id, {
      companyName: "Indústria Teste Recruta",
      confidential: false,
      publicationDate: "2026-10-20",
      title: "Mecânico Industrial",
      salary: "4.200,00",
      salaryNegotiable: false,
      contractType: "TEMPORARIO",
      workMode: "HIBRIDO",
      description: "Manutenção de linhas produtivas.",
      observations: "Documentos necessários no dia da entrevista.",
      applicationInstructions: "",
      status: "PUBLISHED",
    });
    createdJobIds.push(openSalary.id);

    const publicConfidential = await db.getPublicJob(confidential.id);
    expect(publicConfidential?.companyLabel).toBe("Empresa confidencial");
    expect(JSON.stringify(publicConfidential)).not.toContain("MetalurgicaSigilosaXYZ");
    expect(publicConfidential?.salaryLabel).toBe("A combinar");
    expect(publicConfidential?.workModeLabel).toBe("Home office");
    expect(publicConfidential?.contractLabel).toBe("PJ");
    expect(publicConfidential?.description).toContain("\n");
    expect(publicConfidential?.applicationInstructions).toContain("recrutamento@empresa.com.br");

    const storedConfidential = await prisma.jobPosting.findUnique({ where: { id: confidential.id } });
    expect(storedConfidential?.companyName).toBe("MetalurgicaSigilosaXYZ");
    expect(storedConfidential?.origin).toBe("ADMIN");
    expect(storedConfidential?.companyUserId).toBeNull();

    const publicSalary = await db.getPublicJob(openSalary.id);
    expect(publicSalary?.salaryLabel).toContain("4.200,00");
    expect(publicSalary?.companyLabel).toBe("Indústria Teste Recruta");
    expect(publicSalary?.observations).toContain("Documentos");
    expect(publicSalary?.applicationInstructions).toBeNull();
    expect(publicSalary?.workModeLabel).toBe("Híbrido");
    expect(publicSalary?.contractLabel).toBe("Temporário");

    const listed = await db.listPublicJobs();
    expect(listed.some((job) => job.id === confidential.id)).toBe(true);
    expect(listed.some((job) => job.id === openSalary.id)).toBe(true);

    await expect(db.registerJobApplication(confidential.id, companyEmail)).rejects.toThrow(/profissional/i);

    const application = await db.registerJobApplication(confidential.id, proEmail);
    expect(application.userId).toBe(professional.id);
    expect(application.jobId).toBe(confidential.id);
    expect(application.profileId).toBe(profile.id);

    const reread = await prisma.jobApplication.findUnique({ where: { id: application.id } });
    expect(reread?.userId).toBe(professional.id);

    await expect(db.registerJobApplication(confidential.id, proEmail)).rejects.toMatchObject({ status: 409 });

    const withoutEmail = await db.registerJobApplication(openSalary.id, proEmail);
    expect(withoutEmail.userId).toBe(professional.id);

    const adminView = await db.listJobApplicationsForAdmin(confidential.id);
    expect(adminView).toHaveLength(1);
    expect(adminView[0]?.userId).toBe(professional.id);
    expect(adminView[0]?.email).toBe(proEmail);
    expect(adminView.some((item) => item.userId === other.id)).toBe(false);

    const own = await db.getOwnApplicationState(confidential.id, proEmail);
    expect(own.applied).toBe(true);
    const stranger = await db.getOwnApplicationState(confidential.id, otherEmail);
    expect(stranger.applied).toBe(false);
    expect(stranger.canApply).toBe(true);

    await expect(db.listJobApplicationsForCompany(confidential.id, companyUser.id)).rejects.toMatchObject({
      status: 403,
    });

    const edited = await db.updateAdminJob(confidential.id, {
      companyName: "MetalurgicaSigilosaXYZ",
      confidential: true,
      publicationDate: "2026-10-21",
      title: "Analista de Qualidade Sênior",
      salaryNegotiable: true,
      salary: "",
      contractType: "PJ",
      workMode: "HOME_OFFICE",
      description: "Acompanhar indicadores.\nRegistrar não conformidades.",
      observations: "",
      applicationInstructions: "Envie seu currículo para recrutamento@empresa.com.br.",
      status: "PUBLISHED",
    });
    expect(edited.title).toBe("Analista de Qualidade Sênior");

    const stillThere = await prisma.jobApplication.findUnique({ where: { id: application.id } });
    expect(stillThere?.jobId).toBe(confidential.id);
    expect(stillThere?.userId).toBe(professional.id);

    await db.updateAdminJob(openSalary.id, {
      companyName: "Indústria Teste Recruta",
      confidential: false,
      publicationDate: "2026-10-20",
      title: "Mecânico Industrial",
      salary: "4.200,00",
      salaryNegotiable: false,
      contractType: "TEMPORARIO",
      workMode: "HIBRIDO",
      description: "Manutenção de linhas produtivas.",
      status: "CLOSED",
    });
    expect(await db.getPublicJob(openSalary.id)).toBeNull();
    const publicAfterClose = await db.listPublicJobs();
    expect(publicAfterClose.some((job) => job.id === openSalary.id)).toBe(false);
    expect(publicAfterClose.some((job) => job.id === confidential.id)).toBe(true);
  }, 90000);
});
