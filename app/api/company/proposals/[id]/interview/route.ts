import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { ensurePaymentSchema } from "@/lib/ensure-db-schema";
import {
  formatInterviewComprovante,
  scheduleInterview,
  type InterviewLocationType,
} from "@/lib/company/job-proposals";
import {
  notifyProfessionalAsync,
  notifyInterviewInvite,
} from "@/lib/professional-notifications";

async function getCompanyUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  const user = await prisma.user.findUnique({
    where: { email: auth.email },
    include: { company: true },
  });
  if (!user || user.role !== "COMPANY") return null;
  return user;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensurePaymentSchema();
    const companyUser = await getCompanyUser(request);
    if (!companyUser) {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const { id: proposalId } = await params;
    const body = await request.json();
    const scheduledAtRaw = String(body?.scheduledAt ?? "").trim();
    const locationType = String(body?.locationType ?? "").trim().toUpperCase() as InterviewLocationType;
    const address = String(body?.address ?? "").trim();
    const meetingUrl = String(body?.meetingUrl ?? "").trim();
    const observacoes = String(body?.observacoes ?? "").trim();

    if (!scheduledAtRaw) {
      return NextResponse.json(
        { error: "Informe data e horário da entrevista." },
        { status: 400 },
      );
    }
    if (
      locationType !== "PRESENTIAL" &&
      locationType !== "ONLINE" &&
      locationType !== "PLATFORM"
    ) {
      return NextResponse.json({ error: "Tipo de local inválido." }, { status: 400 });
    }

    const scheduledAt = new Date(scheduledAtRaw);
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Data/hora inválida." }, { status: 400 });
    }

    const proposal = await scheduleInterview({
      proposalId,
      companyUserId: companyUser.id,
      scheduledAt,
      locationType,
      address,
      meetingUrl,
      observacoes,
    });

    const comprovante = formatInterviewComprovante({
      companyName: proposal.companyName,
      scheduledAt,
      locationType,
      address: proposal.interview?.address,
      meetingUrl: proposal.interview?.meetingUrl,
      observacoes,
    });

    notifyProfessionalAsync(() =>
      notifyInterviewInvite({
        profileId: proposal.profileId,
        companyName: proposal.companyName,
        comprovanteHtml: comprovante.html,
        comprovanteText: comprovante.text,
      }),
    );

    return NextResponse.json({ success: true, proposal });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "PROPOSAL_NOT_FOUND") {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
    }
    if (msg === "PROPOSAL_NOT_SCHEDULABLE") {
      return NextResponse.json(
        { error: "Só é possível agendar após o profissional demonstrar interesse." },
        { status: 400 },
      );
    }
    if (msg === "MEETING_URL_REQUIRED") {
      return NextResponse.json({ error: "Informe o link do Meet ou Teams." }, { status: 400 });
    }
    if (msg === "ADDRESS_REQUIRED") {
      return NextResponse.json({ error: "Informe o endereço da entrevista." }, { status: 400 });
    }
    console.error("Erro ao agendar entrevista:", error);
    return NextResponse.json({ error: "Erro ao agendar entrevista" }, { status: 500 });
  }
}
