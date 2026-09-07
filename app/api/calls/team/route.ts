import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { getTeamCallContext, respondTeamVideoCall } from "@/lib/video-calls";

async function getAuthUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  return prisma.user.findUnique({
    where: { email: auth.email },
    include: { company: true },
  });
}

/** Colegas da mesma assinatura com o mesmo perfil aberto: chamada entrante para participar. */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const profileId = String(request.nextUrl.searchParams.get("profileId") || "").trim();
    if (!profileId) {
      return NextResponse.json({ error: "Informe profileId" }, { status: 400 });
    }

    const context = await getTeamCallContext(user.id, profileId);
    return NextResponse.json(context);
  } catch (error) {
    console.error("Erro ao buscar chamada da equipe:", error);
    return NextResponse.json({ error: "Erro ao buscar chamada da equipe" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const body = await request.json();
    const profileId = String(body?.profileId || "").trim();
    const callId = String(body?.callId || "").trim();
    const action = String(body?.action || "").trim().toLowerCase();

    if (!profileId || !callId) {
      return NextResponse.json({ error: "Informe profileId e callId" }, { status: 400 });
    }
    if (action !== "accept" && action !== "decline") {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    const result = await respondTeamVideoCall({
      userId: user.id,
      profileId,
      callId,
      action,
      displayName: user.name || user.company?.name || "Participante",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "CALL_NOT_FOUND") {
      return NextResponse.json({ error: "Chamada não encontrada" }, { status: 404 });
    }
    if (msg === "CALL_NOT_ACTIVE") {
      return NextResponse.json({ error: "Esta chamada não está mais ativa" }, { status: 400 });
    }
    if (msg === "CALL_FULL") {
      return NextResponse.json({ error: "A chamada já tem 4 participantes da empresa" }, { status: 400 });
    }
    if (msg === "FORBIDDEN" || msg === "INITIATOR_CANNOT_TEAM_RESPOND") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    console.error("Erro ao responder chamada da equipe:", error);
    return NextResponse.json({ error: "Erro ao responder chamada" }, { status: 500 });
  }
}
