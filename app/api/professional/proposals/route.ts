import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { listProposalsForProfessional } from "@/lib/company/job-proposals";
import { apiUnauthorizedResponse, apiErrorResponse } from "@/lib/i18n/api-response";

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return await apiUnauthorizedResponse();
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      include: { profile: { select: { id: true } } },
    });
    if (!user || user.role !== "PROFESSIONAL" || !user.profile) {
      return await apiErrorResponse("rest.api.professionalOnly", 403);
    }

    const proposals = await listProposalsForProfessional(user.profile.id);
    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("Erro ao listar propostas do profissional:", error);
    return NextResponse.json({ error: "Erro ao listar propostas" }, { status: 500 });
  }
}
