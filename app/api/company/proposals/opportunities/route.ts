import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { ensureJobProposalTables } from "@/lib/ensure-db-schema";
import {
  getCompanyRecruitmentHistory,
  listOpportunitiesForCompany,
} from "@/lib/company/job-proposals";
import { resolveCompanyOwnerUserId } from "@/lib/company/company-team";

/** Lista propostas/entrevistas/arquivadas + histórico do funil da empresa. */
export async function GET(request: NextRequest) {
  try {
    await ensureJobProposalTables();
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      select: { id: true, role: true },
    });
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const ownerUserId = (await resolveCompanyOwnerUserId(user.id)) || user.id;
    const [proposals, history] = await Promise.all([
      listOpportunitiesForCompany(ownerUserId),
      getCompanyRecruitmentHistory(ownerUserId),
    ]);

    return NextResponse.json({ proposals, history });
  } catch (error) {
    console.error("Erro ao listar oportunidades da empresa:", error);
    return NextResponse.json({ error: "Erro ao listar oportunidades" }, { status: 500 });
  }
}
