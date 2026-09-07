import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { ensurePaymentSchema } from "@/lib/ensure-db-schema";
import { respondToProposal } from "@/lib/company/job-proposals";
import {
  notifyProfessionalAsync,
  notifyCompanyProposalResponse,
} from "@/lib/professional-notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensurePaymentSchema();
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      include: { profile: { select: { id: true } } },
    });
    if (!user || user.role !== "PROFESSIONAL" || !user.profile) {
      return NextResponse.json({ error: "Acesso restrito a profissionais" }, { status: 403 });
    }

    const { id: proposalId } = await params;
    const body = await request.json();
    const action = String(body?.action ?? "").trim().toUpperCase();
    if (action !== "INTERESTED" && action !== "MORE_INFO" && action !== "DECLINED") {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    const proposal = await respondToProposal(
      proposalId,
      user.profile.id,
      action as "INTERESTED" | "MORE_INFO" | "DECLINED",
    );

    notifyProfessionalAsync(() =>
      notifyCompanyProposalResponse({
        companyUserId: proposal.companyUserId,
        professionalName: user.name || "Profissional",
        action: action as "INTERESTED" | "MORE_INFO" | "DECLINED",
        cargo: proposal.cargo,
      }),
    );

    return NextResponse.json({ success: true, proposal });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "PROPOSAL_NOT_FOUND") {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
    }
    if (msg === "PROPOSAL_NOT_RESPONDABLE") {
      return NextResponse.json({ error: "Esta proposta já foi respondida." }, { status: 400 });
    }
    console.error("Erro ao responder proposta:", error);
    return NextResponse.json({ error: "Erro ao responder proposta" }, { status: 500 });
  }
}
