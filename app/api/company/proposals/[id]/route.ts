import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { ensureJobProposalTables } from "@/lib/ensure-db-schema";
import { deleteProposalForCompany } from "@/lib/company/job-proposals";
import { resolveCompanyOwnerUserId } from "@/lib/company/company-team";

async function getCompanyOwner(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  const user = await prisma.user.findUnique({
    where: { email: auth.email },
    select: { id: true, role: true },
  });
  if (!user || user.role !== "COMPANY") return null;
  const ownerUserId = (await resolveCompanyOwnerUserId(user.id)) || user.id;
  return { userId: user.id, ownerUserId };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureJobProposalTables();
    const company = await getCompanyOwner(request);
    if (!company) {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const { id: proposalId } = await params;
    await deleteProposalForCompany(proposalId, company.ownerUserId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "PROPOSAL_NOT_FOUND") {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
    }
    console.error("Erro ao excluir proposta (empresa):", error);
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
