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

describe.skipIf(!canRun)("favoritos de vaga do profissional", () => {
  const stamp = Date.now();
  const adminEmail = `job-fav-admin-${stamp}@example.invalid`;
  const proEmail = `job-fav-pro-${stamp}@example.invalid`;
  const createdUserIds: string[] = [];
  const createdJobIds: string[] = [];

  afterAll(async () => {
    if (!canRun) return;
    const { prisma } = await import("@/lib/infra/db");
    const { ensureJobFavoritesTable } = await import("@/lib/infra/ensure-db-schema");
    await ensureJobFavoritesTable();
    if (createdUserIds.length) {
      await prisma.jobFavorite.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.jobPosting.deleteMany({ where: { id: { in: createdJobIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await prisma.$disconnect();
  }, 30000);

  it("guarda só vaga publicada e tira da lista quando a vaga fecha", async () => {
    const { prisma } = await import("@/lib/infra/db");
    const db = await import("@/lib/jobs/job-posting-db");
    const fav = await import("@/lib/jobs/job-favorites");

    const admin = await prisma.user.create({
      data: { email: adminEmail, name: "Admin Favorito", role: "ADMIN" },
    });
    const professional = await prisma.user.create({
      data: { email: proEmail, name: "Profissional Favorito", role: "PROFESSIONAL" },
    });
    createdUserIds.push(admin.id, professional.id);

    const publicada = await db.createAdminJob(admin.id, {
      companyName: "Indústria Favoritos",
      confidential: false,
      publicationDate: "2026-10-22",
      title: "Soldador Favorito",
      salary: "3.100,00",
      salaryNegotiable: false,
      contractType: "CLT",
      workMode: "PRESENCIAL",
      description: "Solda de estruturas metálicas.",
      observations: "",
      applicationInstructions: "",
      status: "PUBLISHED",
    });
    const rascunho = await db.createAdminJob(admin.id, {
      companyName: "Indústria Favoritos",
      confidential: false,
      publicationDate: "2026-10-22",
      title: "Rascunho Oculto",
      salary: "",
      salaryNegotiable: true,
      contractType: "CLT",
      workMode: "PRESENCIAL",
      description: "Vaga ainda não publicada.",
      observations: "",
      applicationInstructions: "",
      status: "DRAFT",
    });
    createdJobIds.push(publicada.id, rascunho.id);

    expect(await fav.setFavoriteJob(professional.id, publicada.id, true)).toBe(true);
    expect(await fav.setFavoriteJob(professional.id, publicada.id, true)).toBe(true);
    expect(await fav.isFavoriteJob(professional.id, publicada.id)).toBe(true);
    expect(await fav.setFavoriteJob(professional.id, rascunho.id, true)).toBe(false);

    const lista = await fav.listFavoriteJobs(professional.id);
    expect(lista.map((job) => job.id)).toEqual([publicada.id]);
    expect(lista[0]?.title).toBe("Soldador Favorito");
    expect(lista[0]?.companyLabel).toBe("Indústria Favoritos");
    expect(JSON.stringify(lista)).not.toContain("Rascunho Oculto");

    await prisma.jobPosting.update({ where: { id: publicada.id }, data: { status: "CLOSED" } });
    expect((await fav.listFavoriteJobs(professional.id)).map((job) => job.id)).not.toContain(publicada.id);
    expect(await fav.isFavoriteJob(professional.id, publicada.id)).toBe(true);

    expect(await fav.setFavoriteJob(professional.id, publicada.id, false)).toBe(false);
    expect(await fav.isFavoriteJob(professional.id, publicada.id)).toBe(false);
    expect(await fav.listFavoriteJobs(professional.id)).toEqual([]);
  }, 30000);
});
