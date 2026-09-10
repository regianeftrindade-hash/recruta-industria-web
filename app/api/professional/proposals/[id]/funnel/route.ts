import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { cancelInterview, getProposalById } from "@/lib/company/job-proposals";
import { upsertProposalFunnel } from "@/lib/company/proposal-funnel";
import { parseProposalFunnelPatch } from "@/lib/company/job-proposals-shared";
import {
  notifyProfessionalAsync,
  notifyCompanyInterviewCancelledByProfessional,
} from "@/lib/professional-notifications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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
    const proposal = await getProposalById(proposalId);
    if (!proposal || proposal.profileId !== user.profile.id) {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const patch = parseProposalFunnelPatch(body);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
    }

    if (patch.entrevistaCancelada === true) {
      if (
        proposal.interview &&
        (proposal.status === "INTERVIEW_PENDING" || proposal.status === "INTERVIEW_CONFIRMED")
      ) {
        const justification =
          String(body.justification || "").trim() || "Cancelada pelo profissional";
        await cancelInterview({
          proposalId,
          profileId: user.profile.id,
          justification,
        });
        notifyProfessionalAsync(() =>
          notifyCompanyInterviewCancelledByProfessional({
            companyUserId: proposal.companyUserId,
            professionalName: user.name || "Profissional",
            justification,
          }),
        );
      }
    }

    const tracking = await upsertProposalFunnel(proposalId, patch);

    return NextResponse.json({
      success: true,
      tracking: {
        contatado: tracking.contatado,
        entrevistado: tracking.entrevistado,
        emTeste: tracking.emTeste,
        contratado: tracking.contratado,
        naoContratado: tracking.naoContratado,
        entrevistaCancelada: tracking.entrevistaCancelada,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar funil da proposta:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
