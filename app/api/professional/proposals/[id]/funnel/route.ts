import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { ensurePaymentSchema } from "@/lib/ensure-db-schema";
import { cancelInterview, getProposalById } from "@/lib/company/job-proposals";
import { upsertCompanyProfileTracking } from "@/lib/company/company-profile-tracking";
import {
  notifyProfessionalAsync,
  notifyCompanyInterviewCancelledByProfessional,
} from "@/lib/professional-notifications";

export async function PATCH(
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
    const proposal = await getProposalById(proposalId);
    if (!proposal || proposal.profileId !== user.profile.id) {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const patch: {
      contatado?: boolean;
      entrevistado?: boolean;
      emTeste?: boolean;
      contratado?: boolean;
      naoContratado?: boolean;
      entrevistaCancelada?: boolean;
    } = {};

    if (typeof body.entrevistado === "boolean") patch.entrevistado = body.entrevistado;
    if (typeof body.emTeste === "boolean") patch.emTeste = body.emTeste;
    if (typeof body.contratado === "boolean") patch.contratado = body.contratado;
    if (typeof body.naoContratado === "boolean") patch.naoContratado = body.naoContratado;
    if (typeof body.entrevistaCancelada === "boolean") {
      patch.entrevistaCancelada = body.entrevistaCancelada;
    }
    if (typeof body.contatado === "boolean") patch.contatado = body.contatado;

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

    const tracking = await upsertCompanyProfileTracking(
      proposal.companyUserId,
      proposal.profileId,
      patch,
    );

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
