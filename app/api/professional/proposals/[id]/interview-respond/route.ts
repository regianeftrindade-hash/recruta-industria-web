import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { ensurePaymentSchema } from "@/lib/ensure-db-schema";
import {
  formatInterviewComprovante,
  respondToInterview,
} from "@/lib/company/job-proposals";
import {
  notifyProfessionalAsync,
  notifyInterviewConfirmedToProfessional,
  notifyCompanyInterviewResponse,
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
    if (action !== "CONFIRM" && action !== "DECLINE") {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    const proposal = await respondToInterview(
      proposalId,
      user.profile.id,
      action as "CONFIRM" | "DECLINE",
    );

    if (!proposal.interview) {
      return NextResponse.json({ error: "Entrevista não encontrada" }, { status: 404 });
    }

    const comprovante = formatInterviewComprovante({
      companyName: proposal.companyName,
      scheduledAt: proposal.interview.scheduledAt,
      locationType: proposal.interview.locationType,
      address: proposal.interview.address,
      meetingUrl: proposal.interview.meetingUrl,
      observacoes: proposal.interview.observacoes,
    });

    if (action === "CONFIRM") {
      notifyProfessionalAsync(() =>
        notifyInterviewConfirmedToProfessional({
          profileId: proposal.profileId,
          companyName: proposal.companyName,
          comprovanteHtml: comprovante.html,
          comprovanteText: comprovante.text,
        }),
      );
    }

    notifyProfessionalAsync(() =>
      notifyCompanyInterviewResponse({
        companyUserId: proposal.companyUserId,
        professionalName: user.name || "Profissional",
        confirmed: action === "CONFIRM",
        comprovanteText: comprovante.text,
      }),
    );

    return NextResponse.json({ success: true, proposal });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "PROPOSAL_NOT_FOUND") {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
    }
    if (msg === "INTERVIEW_NOT_PENDING") {
      return NextResponse.json({ error: "Não há entrevista pendente nesta proposta." }, { status: 400 });
    }
    console.error("Erro ao responder entrevista:", error);
    return NextResponse.json({ error: "Erro ao responder entrevista" }, { status: 500 });
  }
}
