import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import {
  assertInviteableTeamPeer,
  resolveCompanyActor,
} from "@/lib/company/company-team";
import {
  addCallParticipant,
  endVideoCall,
  getVideoCallById,
  listCallParticipants,
  removeCallParticipant,
  respondVideoCall,
} from "@/lib/video-calls";

async function getAuthUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  return prisma.user.findUnique({
    where: { email: auth.email },
    include: { profile: true, company: true },
  });
}

async function sharesCompanySubscription(userA: string, userB: string): Promise<boolean> {
  const actorA = await resolveCompanyActor(userA);
  const actorB = await resolveCompanyActor(userB);
  if (!actorA || !actorB) return false;
  return actorA.ownerUserId === actorB.ownerUserId;
}

async function canAccessCompanyCall(userId: string, call: { companyUserId: string; companyOwnerUserId: string }): Promise<boolean> {
  if (call.companyUserId === userId) return true;
  return sharesCompanySubscription(userId, call.companyUserId);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const { id } = await params;
    const call = await getVideoCallById(id);
    if (!call) {
      return NextResponse.json({ error: "Chamada não encontrada" }, { status: 404 });
    }
    const isCompany =
      user.role === "COMPANY" && (await canAccessCompanyCall(user.id, call));
    const isProfessional = user.role === "PROFESSIONAL" && call.profileId === user.profile?.id;
    if (!isCompany && !isProfessional) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    const participants = await listCallParticipants(id);
    return NextResponse.json({ call, participants });
  } catch (error) {
    console.error("Erro ao buscar chamada:", error);
    return NextResponse.json({ error: "Erro ao buscar chamada" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const action = String(body?.action || "").trim().toLowerCase();

    if (action === "accept" || action === "decline") {
      if (user.role !== "PROFESSIONAL" || !user.profile?.id) {
        return NextResponse.json({ error: "Apenas o profissional pode responder" }, { status: 403 });
      }
      const call = await respondVideoCall(id, user.profile.id, action);
      return NextResponse.json({ success: true, call });
    }

    if (action === "end") {
      const call = await endVideoCall(id, {
        companyUserId: user.role === "COMPANY" ? user.id : undefined,
        profileId: user.role === "PROFESSIONAL" ? user.profile?.id : undefined,
      });
      return NextResponse.json({ success: true, call });
    }

    if (action === "add-participant") {
      const call = await getVideoCallById(id);
      if (!call) {
        return NextResponse.json({ error: "Chamada não encontrada" }, { status: 404 });
      }
      if (user.role !== "COMPANY" || !(await canAccessCompanyCall(user.id, call))) {
        return NextResponse.json({ error: "Apenas a empresa da chamada pode adicionar participantes" }, { status: 403 });
      }
      const name = String(body?.name || "").trim();
      if (!name) {
        return NextResponse.json({ error: "Informe o nome do participante" }, { status: 400 });
      }
      try {
        await assertInviteableTeamPeer(user.id, { name });
      } catch {
        return NextResponse.json(
          { error: "Só é possível convidar pessoas da mesma assinatura/plano." },
          { status: 403 },
        );
      }
      const participants = await addCallParticipant(id, name);
      return NextResponse.json({ success: true, participants });
    }

    if (action === "remove-participant") {
      const call = await getVideoCallById(id);
      if (!call) {
        return NextResponse.json({ error: "Chamada não encontrada" }, { status: 404 });
      }
      if (user.role !== "COMPANY" || !(await canAccessCompanyCall(user.id, call))) {
        return NextResponse.json({ error: "Apenas a empresa da chamada pode remover participantes" }, { status: 403 });
      }
      const participantId = String(body?.participantId || "").trim();
      if (!participantId) {
        return NextResponse.json({ error: "Informe o participante" }, { status: 400 });
      }
      const participants = await removeCallParticipant(id, participantId);
      return NextResponse.json({ success: true, participants });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "CALL_NOT_FOUND") {
      return NextResponse.json({ error: "Chamada não encontrada" }, { status: 404 });
    }
    if (msg === "CALL_NOT_RINGING") {
      return NextResponse.json({ error: "Esta chamada não está mais tocando" }, { status: 400 });
    }
    if (msg === "CALL_FULL") {
      return NextResponse.json({ error: "A chamada já tem 4 participantes da empresa" }, { status: 400 });
    }
    if (msg === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    console.error("Erro ao responder chamada:", error);
    return NextResponse.json({ error: "Erro ao atualizar chamada" }, { status: 500 });
  }
}
