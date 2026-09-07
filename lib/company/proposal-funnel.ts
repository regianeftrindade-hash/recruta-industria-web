import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { ensureJobProposalTables } from "@/lib/ensure-db-schema";
import {
  EMPTY_PROPOSAL_TRACKING,
  mergeProposalFunnel,
  type ProposalFunnelTracking,
} from "@/lib/company/job-proposals-shared";

export async function upsertProposalFunnel(
  proposalId: string,
  patch: Partial<ProposalFunnelTracking>,
): Promise<ProposalFunnelTracking> {
  await ensureJobProposalTables();
  const rows = await prisma.$queryRawUnsafe<ProposalFunnelTracking[]>(
    `SELECT contatado, entrevistado, "emTeste", contratado, "naoContratado", "entrevistaCancelada"
     FROM "JobProposalTracking"
     WHERE "proposalId" = $1
     LIMIT 1`,
    proposalId,
  );
  const current = rows[0]
    ? {
        contatado: Boolean(rows[0].contatado),
        entrevistado: Boolean(rows[0].entrevistado),
        emTeste: Boolean(rows[0].emTeste),
        contratado: Boolean(rows[0].contratado),
        naoContratado: Boolean(rows[0].naoContratado),
        entrevistaCancelada: Boolean(rows[0].entrevistaCancelada),
      }
    : { ...EMPTY_PROPOSAL_TRACKING };
  const next = mergeProposalFunnel(current, patch);

  await prisma.$executeRawUnsafe(
    `INSERT INTO "JobProposalTracking" (
       id, "proposalId", contatado, entrevistado, "emTeste", contratado, "naoContratado", "entrevistaCancelada",
       "createdAt", "updatedAt"
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     ON CONFLICT ("proposalId") DO UPDATE SET
       contatado = EXCLUDED.contatado,
       entrevistado = EXCLUDED.entrevistado,
       "emTeste" = EXCLUDED."emTeste",
       contratado = EXCLUDED.contratado,
       "naoContratado" = EXCLUDED."naoContratado",
       "entrevistaCancelada" = EXCLUDED."entrevistaCancelada",
       "updatedAt" = NOW()`,
    randomUUID(),
    proposalId,
    next.contatado,
    next.entrevistado,
    next.emTeste,
    next.contratado,
    next.naoContratado,
    next.entrevistaCancelada,
  );

  return next;
}
