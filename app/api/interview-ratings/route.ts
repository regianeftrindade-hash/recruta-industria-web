import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { getVideoCallById } from "@/lib/video-calls";
import {
  createInterviewRating,
  listInterviewRatingsForCompany,
} from "@/lib/interview-ratings";

async function getAuthUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  return prisma.user.findUnique({
    where: { email: auth.email },
    include: { profile: true },
  });
}

/** Empresa: lista as avaliações confidenciais recebidas. */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }
    const ratings = await listInterviewRatingsForCompany(user.id);
    return NextResponse.json({ ratings });
  } catch (error) {
    console.error("Erro ao listar avaliações de entrevista:", error);
    return NextResponse.json({ error: "Erro ao listar avaliações" }, { status: 500 });
  }
}

/** Profissional: envia avaliação confidencial após a entrevista. */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "PROFESSIONAL" || !user.profile?.id) {
      return NextResponse.json({ error: "Apenas o profissional pode avaliar a entrevista" }, { status: 403 });
    }

    const body = await request.json();
    const callId = String(body?.callId || "").trim();
    const rating = Number(body?.rating);
    const reason = String(body?.reason || "").trim().slice(0, 2000);

    if (!callId) {
      return NextResponse.json({ error: "Chamada não informada" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "A nota deve ser de 1 a 5 estrelas" }, { status: 400 });
    }

    const call = await getVideoCallById(callId);
    if (!call || call.profileId !== user.profile.id) {
      return NextResponse.json({ error: "Chamada não encontrada" }, { status: 404 });
    }

    const id = await createInterviewRating({
      callId,
      companyUserId: call.companyUserId,
      profileId: user.profile.id,
      rating,
      reason,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "ALREADY_RATED") {
      return NextResponse.json({ error: "Você já avaliou esta entrevista" }, { status: 400 });
    }
    console.error("Erro ao registrar avaliação de entrevista:", error);
    return NextResponse.json({ error: "Erro ao registrar avaliação" }, { status: 500 });
  }
}
