import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { listActiveTeamPeers, resolveCompanyActor } from "@/lib/company/company-team";
import { apiUnauthorizedResponse, apiErrorResponse } from "@/lib/i18n/api-response";

/**
 * Pessoas da mesma assinatura/plano para convidar em chat e videochamada.
 * Apenas membros ACTIVE da equipe (CompanyTeamMember) — sem heurística de CNPJ/domínio.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return await apiUnauthorizedResponse();
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      include: { company: true },
    });

    if (!user || user.role !== "COMPANY") {
      return await apiErrorResponse("rest.api.companyOnly", 403);
    }

    const actor = await resolveCompanyActor(user.id);
    if (!actor) {
      return NextResponse.json({ members: [] });
    }

    const peers = await listActiveTeamPeers(user.id);
    const owner = await prisma.user.findUnique({
      where: { id: actor.ownerUserId },
      include: { company: true },
    });
    const companyName = owner?.company?.name || user.company?.name || "";

    return NextResponse.json({
      members: peers.map((p) => ({
        ...p,
        companyName: companyName || p.companyName,
      })),
    });
  } catch (error) {
    console.error("Erro ao listar pessoas do RH:", error);
    return NextResponse.json({ error: "Erro ao listar pessoas do RH" }, { status: 500 });
  }
}
