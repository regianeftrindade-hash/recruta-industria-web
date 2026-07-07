import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import type { IndustrialFilters } from '@/lib/profile-industrial';
import {
  calculateCompatibilityScore,
  matchesIndustrialFilters,
  parseProfileIndustrial,
} from '@/lib/profile-industrial';

let tablesEnsured = false;

export async function ensureCompanyFeatureTables(): Promise<void> {
  if (tablesEnsured) return;

  const statements = [
    `CREATE TABLE IF NOT EXISTS "CompanyTalentList" (
      id TEXT PRIMARY KEY,
      "companyUserId" TEXT NOT NULL,
      name TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "CompanyTalentListItem" (
      id TEXT PRIMARY KEY,
      "listId" TEXT NOT NULL,
      "profileId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("listId", "profileId")
    )`,
    `CREATE TABLE IF NOT EXISTS "CompanyAlert" (
      id TEXT PRIMARY KEY,
      "companyUserId" TEXT NOT NULL,
      name TEXT NOT NULL,
      "filtersJSON" TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "CompanyTalentList_companyUserId_idx" ON "CompanyTalentList"("companyUserId")`,
    `CREATE INDEX IF NOT EXISTS "CompanyTalentListItem_listId_idx" ON "CompanyTalentListItem"("listId")`,
    `CREATE INDEX IF NOT EXISTS "CompanyAlert_companyUserId_idx" ON "CompanyAlert"("companyUserId")`,
  ];

  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }

  tablesEnsured = true;
}

export type TalentListRow = { id: string; name: string; createdAt: Date; itemCount: bigint };

export async function listTalentLists(companyUserId: string): Promise<TalentListRow[]> {
  await ensureCompanyFeatureTables();
  return prisma.$queryRaw<TalentListRow[]>`
    SELECT l.id, l.name, l."createdAt", COUNT(i.id)::bigint AS "itemCount"
    FROM "CompanyTalentList" l
    LEFT JOIN "CompanyTalentListItem" i ON i."listId" = l.id
    WHERE l."companyUserId" = ${companyUserId}
    GROUP BY l.id, l.name, l."createdAt"
    ORDER BY l."createdAt" ASC
  `;
}

export async function createTalentList(companyUserId: string, name: string): Promise<string> {
  await ensureCompanyFeatureTables();
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "CompanyTalentList" (id, "companyUserId", name, "createdAt")
    VALUES (${id}, ${companyUserId}, ${name}, NOW())
  `;
  return id;
}

export async function deleteTalentList(companyUserId: string, listId: string): Promise<void> {
  await ensureCompanyFeatureTables();
  await prisma.$executeRaw`
    DELETE FROM "CompanyTalentListItem"
    WHERE "listId" = ${listId}
      AND "listId" IN (SELECT id FROM "CompanyTalentList" WHERE "companyUserId" = ${companyUserId})
  `;
  await prisma.$executeRaw`
    DELETE FROM "CompanyTalentList"
    WHERE id = ${listId} AND "companyUserId" = ${companyUserId}
  `;
}

export async function addProfileToTalentList(
  companyUserId: string,
  listId: string,
  profileId: string,
): Promise<void> {
  await ensureCompanyFeatureTables();
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "CompanyTalentList"
    WHERE id = ${listId} AND "companyUserId" = ${companyUserId}
    LIMIT 1
  `;
  if (!rows[0]) throw new Error('Lista não encontrada');
  await prisma.$executeRaw`
    INSERT INTO "CompanyTalentListItem" (id, "listId", "profileId", "createdAt")
    VALUES (${randomUUID()}, ${listId}, ${profileId}, NOW())
    ON CONFLICT ("listId", "profileId") DO NOTHING
  `;
}

export async function removeProfileFromTalentList(
  companyUserId: string,
  listId: string,
  profileId: string,
): Promise<void> {
  await ensureCompanyFeatureTables();
  await prisma.$executeRaw`
    DELETE FROM "CompanyTalentListItem"
    WHERE "listId" = ${listId}
      AND "profileId" = ${profileId}
      AND "listId" IN (SELECT id FROM "CompanyTalentList" WHERE "companyUserId" = ${companyUserId})
  `;
}

export async function listTalentListProfileIds(listId: string, companyUserId: string): Promise<string[]> {
  await ensureCompanyFeatureTables();
  const rows = await prisma.$queryRaw<Array<{ profileId: string }>>`
    SELECT i."profileId"
    FROM "CompanyTalentListItem" i
    JOIN "CompanyTalentList" l ON l.id = i."listId"
    WHERE i."listId" = ${listId} AND l."companyUserId" = ${companyUserId}
    ORDER BY i."createdAt" DESC
  `;
  return rows.map((r) => r.profileId);
}

export type AlertRow = {
  id: string;
  name: string;
  filtersJSON: string;
  active: boolean;
  createdAt: Date;
};

export async function listCompanyAlerts(companyUserId: string): Promise<AlertRow[]> {
  await ensureCompanyFeatureTables();
  return prisma.$queryRaw<AlertRow[]>`
    SELECT id, name, "filtersJSON", active, "createdAt"
    FROM "CompanyAlert"
    WHERE "companyUserId" = ${companyUserId}
    ORDER BY "createdAt" DESC
  `;
}

export async function createCompanyAlert(
  companyUserId: string,
  name: string,
  filters: IndustrialFilters,
): Promise<string> {
  await ensureCompanyFeatureTables();
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "CompanyAlert" (id, "companyUserId", name, "filtersJSON", active, "createdAt")
    VALUES (${id}, ${companyUserId}, ${name}, ${JSON.stringify(filters)}, true, NOW())
  `;
  return id;
}

export async function deleteCompanyAlert(companyUserId: string, alertId: string): Promise<void> {
  await ensureCompanyFeatureTables();
  await prisma.$executeRaw`
    DELETE FROM "CompanyAlert"
    WHERE id = ${alertId} AND "companyUserId" = ${companyUserId}
  `;
}

export async function toggleCompanyAlert(
  companyUserId: string,
  alertId: string,
  active: boolean,
): Promise<void> {
  await ensureCompanyFeatureTables();
  await prisma.$executeRaw`
    UPDATE "CompanyAlert"
    SET active = ${active}
    WHERE id = ${alertId} AND "companyUserId" = ${companyUserId}
  `;
}

type ProfileForMatch = {
  id: string;
  updatedAt: Date;
  formDataJSON: string | null;
  cursosCertificacoes: string | null;
  experienciasJSON: string | null;
  disponibilidadeMudanca: string | null;
  disponibilidadeInicio: string | null;
  disponivelContratacao: string | null;
  cargoDesejado: string | null;
  title: string | null;
  areaInteresse: string | null;
  tempoExperiencia: string | null;
  turnoDisponivel: string | null;
  recolocacao: string | null;
  pretensaoSalarial: string | null;
  escolaridade: string | null;
  estado: string | null;
  cidade: string | null;
  skills: string | null;
  profileCompletion: number;
  isVisible: boolean;
  status: string;
};

export async function findAlertMatches(
  filters: IndustrialFilters,
  since: Date,
  limit = 20,
): Promise<{ profileId: string; score: number; updatedAt: string }[]> {
  const profiles = await prisma.profile.findMany({
    where: {
      isVisible: true,
      status: 'ACTIVE',
      updatedAt: { gte: since },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  }) as ProfileForMatch[];

  const matches: { profileId: string; score: number; updatedAt: string }[] = [];
  for (const profile of profiles) {
    const industrial = parseProfileIndustrial(profile);
    if (!matchesIndustrialFilters(profile, industrial, filters)) continue;
    const score = calculateCompatibilityScore(profile, industrial, filters);
    matches.push({
      profileId: profile.id,
      score,
      updatedAt: profile.updatedAt.toISOString(),
    });
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function seedDefaultTalentLists(companyUserId: string): Promise<void> {
  await ensureCompanyFeatureTables();
  const existing = await listTalentLists(companyUserId);
  if (existing.length > 0) return;
  const defaults = ['Operadores CNC', 'Qualidade', 'PCP', 'Logística', 'Engenharia', 'Produção'];
  for (const name of defaults) {
    await createTalentList(companyUserId, name);
  }
}
