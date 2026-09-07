import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { ensurePaymentSchema } from "@/lib/ensure-db-schema";
import { deleteProposalForProfessional } from "@/lib/company/job-proposals";

export async function DELETE(
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
    await deleteProposalForProfessional(proposalId, user.profile.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "PROPOSAL_NOT_FOUND") {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
    }
    console.error("Erro ao excluir proposta:", error);
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
