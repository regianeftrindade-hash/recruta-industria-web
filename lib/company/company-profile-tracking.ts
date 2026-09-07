import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { ensureTrackingEmTesteColumn } from "@/lib/ensure-db-schema";

export type CompanyProfileTrackingData = {
  contatado: boolean;
  entrevistado: boolean;
  emTeste: boolean;
  contratado: boolean;
  naoContratado: boolean;
  entrevistaCancelada: boolean;
  notes: string;
};

export const EMPTY_TRACKING: CompanyProfileTrackingData = {
  contatado: false,
  entrevistado: false,
  emTeste: false,
  contratado: false,
  naoContratado: false,
  entrevistaCancelada: false,
  notes: "",
};

type TrackingRow = {
  contatado: boolean;
  entrevistado: boolean;
  emTeste?: boolean;
  contratado: boolean;
  naoContratado?: boolean;
  entrevistaCancelada?: boolean;
  notes: string | null;
};

function mapRow(row: TrackingRow): CompanyProfileTrackingData {
  return {
    contatado: Boolean(row.contatado),
    entrevistado: Boolean(row.entrevistado),
    emTeste: Boolean(row.emTeste),
    contratado: Boolean(row.contratado),
    naoContratado: Boolean(row.naoContratado),
    entrevistaCancelada: Boolean(row.entrevistaCancelada),
    notes: row.notes || "",
  };
}

export async function getCompanyProfileTracking(
  companyUserId: string,
  profileId: string,
): Promise<CompanyProfileTrackingData> {
  await ensureTrackingEmTesteColumn();
  try {
    const rows = await prisma.$queryRawUnsafe<TrackingRow[]>(
      `SELECT contatado, entrevistado,
              COALESCE("emTeste", false) AS "emTeste",
              contratado,
              COALESCE("naoContratado", false) AS "naoContratado",
              COALESCE("entrevistaCancelada", false) AS "entrevistaCancelada",
              notes
       FROM "CompanyProfileTracking"
       WHERE "companyUserId" = $1 AND "profileId" = $2
       LIMIT 1`,
      companyUserId,
      profileId,
    );
    if (!rows[0]) return { ...EMPTY_TRACKING };
    return mapRow(rows[0]);
  } catch (error) {
    console.warn("CompanyProfileTracking indisponível:", error);
    return { ...EMPTY_TRACKING };
  }
}

export async function upsertCompanyProfileTracking(
  companyUserId: string,
  profileId: string,
  data: Partial<CompanyProfileTrackingData>,
): Promise<CompanyProfileTrackingData> {
  await ensureTrackingEmTesteColumn();
  try {
    const current = await getCompanyProfileTracking(companyUserId, profileId);
    const next: CompanyProfileTrackingData = {
      contatado: data.contatado ?? current.contatado,
      entrevistado: data.entrevistado ?? current.entrevistado,
      emTeste: data.emTeste ?? current.emTeste,
      contratado: data.contratado ?? current.contratado,
      naoContratado: data.naoContratado ?? current.naoContratado,
      entrevistaCancelada: data.entrevistaCancelada ?? current.entrevistaCancelada,
      notes: data.notes !== undefined ? data.notes : current.notes,
    };

    if (data.contratado === true) next.naoContratado = false;
    if (data.naoContratado === true) next.contratado = false;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "CompanyProfileTracking" (
         id, "companyUserId", "profileId",
         contatado, entrevistado, "emTeste", contratado, "naoContratado", "entrevistaCancelada", notes,
         "createdAt", "updatedAt"
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
       )
       ON CONFLICT ("companyUserId", "profileId") DO UPDATE SET
         contatado = EXCLUDED.contatado,
         entrevistado = EXCLUDED.entrevistado,
         "emTeste" = EXCLUDED."emTeste",
         contratado = EXCLUDED.contratado,
         "naoContratado" = EXCLUDED."naoContratado",
         "entrevistaCancelada" = EXCLUDED."entrevistaCancelada",
         notes = EXCLUDED.notes,
         "updatedAt" = NOW()`,
      randomUUID(),
      companyUserId,
      profileId,
      next.contatado,
      next.entrevistado,
      next.emTeste,
      next.contratado,
      next.naoContratado,
      next.entrevistaCancelada,
      next.notes.trim() || null,
    );

    return next;
  } catch (error) {
    console.warn("Falha ao salvar CompanyProfileTracking:", error);
    return {
      ...EMPTY_TRACKING,
      ...data,
      notes: data.notes ?? "",
      emTeste: data.emTeste ?? false,
      naoContratado: data.naoContratado ?? false,
      entrevistaCancelada: data.entrevistaCancelada ?? false,
    };
  }
}
