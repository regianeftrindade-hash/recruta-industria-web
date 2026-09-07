import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { resolveCompanyActor } from "@/lib/company/company-team";
import {
  getVideoCallById,
  insertCallSignal,
  listCallSignalsForPeer,
} from "@/lib/video-calls";

async function getAuthUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  return prisma.user.findUnique({
    where: { email: auth.email },
    include: { profile: true, company: true },
  });
}

async function canAccessCall(
  user: { id: string; role: string; profile?: { id: string } | null },
  call: { companyUserId: string; companyOwnerUserId: string; profileId: string },
): Promise<boolean> {
  if (user.role === "PROFESSIONAL" && call.profileId === user.profile?.id) return true;
  if (user.role !== "COMPANY") return false;
  if (call.companyUserId === user.id) return true;
  const actor = await resolveCompanyActor(user.id);
  return Boolean(actor && actor.ownerUserId === call.companyOwnerUserId);
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
    if (!(await canAccessCall(user, call))) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    const signals = await listCallSignalsForPeer(id, user.id);
    return NextResponse.json({ signals });
  } catch (error) {
    console.error("Erro ao listar sinalização da chamada:", error);
    return NextResponse.json({ error: "Erro ao buscar sinalização" }, { status: 500 });
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
    const call = await getVideoCallById(id);
    if (!call) {
      return NextResponse.json({ error: "Chamada não encontrada" }, { status: 404 });
    }
    if (call.status !== "ACCEPTED" && call.status !== "RINGING") {
      return NextResponse.json({ error: "Chamada inativa" }, { status: 400 });
    }
    if (!(await canAccessCall(user, call))) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const type = String(body?.type || "").trim();
    if (type !== "offer" && type !== "answer" && type !== "ice") {
      return NextResponse.json({ error: "Tipo de sinal inválido" }, { status: 400 });
    }
    const payload = JSON.stringify(body?.payload ?? {});
    if (payload.length > 40000) {
      return NextResponse.json({ error: "Sinal grande demais" }, { status: 400 });
    }

    await insertCallSignal({
      callId: id,
      fromUserId: user.id,
      type,
      payload,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao enviar sinal da chamada:", error);
    return NextResponse.json({ error: "Erro ao enviar sinalização" }, { status: 500 });
  }
}
