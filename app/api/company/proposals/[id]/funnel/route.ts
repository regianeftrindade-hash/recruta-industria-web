import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { getProposalById } from "@/lib/company/job-proposals";
import { upsertProposalFunnel } from "@/lib/company/proposal-funnel";
import { resolveCompanyOwnerUserId } from "@/lib/company/company-team";
import { parseProposalFunnelPatch } from "@/lib/company/job-proposals-shared";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const company = await getCompanyOwner(request);
    if (!company) {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const { id: proposalId } = await params;
    const proposal = await getProposalById(proposalId);
    if (!proposal || proposal.companyUserId !== company.ownerUserId) {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const patch = parseProposalFunnelPatch(body);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
    }

    const tracking = await upsertProposalFunnel(proposalId, patch);
    return NextResponse.json({ success: true, tracking });
  } catch (error) {
    console.error("Erro ao atualizar funil da proposta (empresa):", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
