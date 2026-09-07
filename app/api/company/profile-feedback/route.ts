import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import {
  addProfileFeedback,
  listProfileFeedbacks,
} from "@/lib/company/company-profile-feedback";

async function getCompanyUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  return prisma.user.findUnique({
    where: { email: auth.email },
  });
}

/** Lista os feedbacks da equipe (mesmo plano) sobre um candidato. */
export async function GET(request: NextRequest) {
  try {
    const user = await getCompanyUser(request);
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const profileId = String(request.nextUrl.searchParams.get("profileId") || "").trim();
    if (!profileId) {
      return NextResponse.json({ error: "Informe profileId" }, { status: 400 });
    }

    const feedbacks = await listProfileFeedbacks(user.id, profileId);
    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error("Erro ao listar feedbacks:", error);
    return NextResponse.json({ error: "Erro ao listar feedbacks" }, { status: 500 });
  }
}

/** Registra um feedback sobre o candidato. */
export async function POST(request: NextRequest) {
  try {
    const user = await getCompanyUser(request);
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const profileId = String(body?.profileId || "").trim();
    const text = String(body?.body || "").trim();

    if (!profileId) {
      return NextResponse.json({ error: "Informe o perfil" }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json({ error: "Escreva o feedback antes de enviar" }, { status: 400 });
    }

    const feedbacks = await addProfileFeedback({
      userId: user.id,
      profileId,
      body: text,
    });

    return NextResponse.json({ success: true, feedbacks });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "FORBIDDEN") {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
    if (msg === "EMPTY_BODY") {
      return NextResponse.json({ error: "Escreva o feedback antes de enviar" }, { status: 400 });
    }
    console.error("Erro ao salvar feedback:", error);
    return NextResponse.json({ error: "Erro ao salvar feedback" }, { status: 500 });
  }
}
