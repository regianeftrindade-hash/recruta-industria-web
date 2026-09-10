import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { getProfessionalRecruitmentHistory } from "@/lib/company/job-proposals";
import { lerCampoJsonDoPerfil } from "@/lib/profile-json-fields";
import { parseTesteComportamentalJSON } from "@/lib/teste-comportamental";

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      include: { profile: { select: { id: true, userId: true } } },
    });
    if (!user || user.role !== "PROFESSIONAL" || !user.profile) {
      return NextResponse.json({ error: "Acesso restrito a profissionais" }, { status: 403 });
    }

    const [counts, testeRaw] = await Promise.all([
      getProfessionalRecruitmentHistory(user.profile.id),
      lerCampoJsonDoPerfil(user.id, "testeComportamentalJSON"),
    ]);

    const testeComportamental = parseTesteComportamentalJSON(testeRaw);
    const testes = counts.testes + (testeComportamental ? 1 : 0);

    return NextResponse.json({
      history: {
        propostas: counts.propostas,
        entrevistas: counts.entrevistas,
        testes,
        contratacoes: counts.contratacoes,
        naoContratacoes: counts.naoContratacoes,
        testeComportamental: Boolean(testeComportamental),
      },
    });
  } catch (error) {
    console.error("Erro ao carregar histórico do profissional:", error);
    return NextResponse.json({ error: "Erro ao carregar histórico" }, { status: 500 });
  }
}
