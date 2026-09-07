import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { ensurePaymentSchema } from "@/lib/ensure-db-schema";
import { listProposalsForProfessional } from "@/lib/company/job-proposals";

export async function GET(request: NextRequest) {
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

    const proposals = await listProposalsForProfessional(user.profile.id);
    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("Erro ao listar propostas do profissional:", error);
    return NextResponse.json({ error: "Erro ao listar propostas" }, { status: 500 });
  }
}
