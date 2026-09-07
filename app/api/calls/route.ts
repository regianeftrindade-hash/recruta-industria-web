import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { resolveCompanyActor } from "@/lib/company/company-team";
import { createVideoCallInvite, getIncomingCallForProfile } from "@/lib/video-calls";

async function getAuthUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  return prisma.user.findUnique({
    where: { email: auth.email },
    include: { company: true, profile: true },
  });
}

/** Empresa: cria convite de chamada. Profissional: lista chamada entrante. */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role === "PROFESSIONAL") {
      const profileId = user.profile?.id;
      if (!profileId) {
        return NextResponse.json({ call: null });
      }
      const call = await getIncomingCallForProfile(profileId);
      return NextResponse.json({ call });
    }

    return NextResponse.json({ error: "Use GET /api/calls/[id] para status" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao listar chamadas:", error);
    return NextResponse.json({ error: "Erro ao listar chamadas" }, { status: 500 });
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
    if (!profileId) {
      return NextResponse.json({ error: "Informe profileId" }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
    }

    const companyName = user.company?.name || user.name || "Empresa";
    const actor = await resolveCompanyActor(user.id);
    if (!actor) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const call = await createVideoCallInvite({
      profileId,
      companyUserId: user.id,
      companyOwnerUserId: actor.ownerUserId,
      companyName: String(companyName),
      initiatorName: user.name || companyName,
    });

    return NextResponse.json({ success: true, call });
  } catch (error) {
    console.error("Erro ao iniciar chamada:", error);
    return NextResponse.json({ error: "Erro ao iniciar chamada" }, { status: 500 });
  }
}
