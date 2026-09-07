import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { ensurePaymentSchema } from "@/lib/ensure-db-schema";
import { cancelInterview } from "@/lib/company/job-proposals";
import {
  notifyProfessionalAsync,
  notifyInterviewCancelled,
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

/** POST — cancela entrevista com justificativa (empresa). */
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
    const body = await request.json().catch(() => ({}));
    const justification = String(body?.justification ?? body?.motivo ?? "").trim();
    if (!justification) {
      return NextResponse.json(
        { error: "Informe a justificativa do cancelamento." },
        { status: 400 },
      );
    }

    const proposal = await cancelInterview({
      proposalId,
      companyUserId: companyUser.id,
      justification,
    });

    notifyProfessionalAsync(() =>
      notifyInterviewCancelled({
        profileId: proposal.profileId,
        companyName: proposal.companyName,
        justification,
        by: "company",
      }),
    );

    return NextResponse.json({ success: true, proposal });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "PROPOSAL_NOT_FOUND" || msg === "INTERVIEW_NOT_FOUND") {
      return NextResponse.json({ error: "Entrevista não encontrada" }, { status: 404 });
    }
    if (msg === "INTERVIEW_NOT_CANCELLABLE") {
      return NextResponse.json(
        { error: "Esta entrevista não pode ser cancelada neste status." },
        { status: 400 },
      );
    }
    console.error("Erro ao cancelar entrevista:", error);
    return NextResponse.json({ error: "Erro ao cancelar entrevista" }, { status: 500 });
  }
}
