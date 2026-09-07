import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { ensureJobProposalTables } from "@/lib/ensure-db-schema";
import { listScheduledInterviewsForCompany } from "@/lib/company/job-proposals";
import { resolveCompanyOwnerUserId } from "@/lib/company/company-team";

export async function GET(request: NextRequest) {
  try {
    // Só as tabelas de proposta/entrevista — não o schema de pagamento inteiro
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
    const interviews = await listScheduledInterviewsForCompany(ownerUserId);
    return NextResponse.json({ interviews });
  } catch (error) {
    console.error("Erro ao listar entrevistas agendadas:", error);
    return NextResponse.json({ error: "Erro ao listar entrevistas" }, { status: 500 });
  }
}
