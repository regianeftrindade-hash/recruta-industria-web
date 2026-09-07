import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { clearUserPresence, touchUserPresence } from "@/lib/presence";

async function resolveUserId(request: NextRequest): Promise<string | null> {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  const user = await prisma.user.findUnique({
    where: { email: auth.email },
    select: { id: true },
  });
  return user?.id ?? null;
}

/** Heartbeat: marca o usuário autenticado como online. Body `{ offline: true }` marca offline. */
export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    let offline = false;
    try {
      const body = await request.json().catch(() => null);
      offline = body?.offline === true || body?.action === "offline";
    } catch {
      offline = false;
    }

    if (offline) {
      await clearUserPresence(userId);
      return NextResponse.json({ ok: true, online: false });
    }

    await touchUserPresence(userId);
    return NextResponse.json({ ok: true, online: true });
  } catch (error) {
    console.error("Erro no heartbeat de presença:", error);
    return NextResponse.json({ error: "Erro ao atualizar presença" }, { status: 500 });
  }
}

/** Marca o usuário como offline (sair do painel / fechar aba). */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    await clearUserPresence(userId);
    return NextResponse.json({ ok: true, online: false });
  } catch (error) {
    console.error("Erro ao limpar presença:", error);
    return NextResponse.json({ error: "Erro ao limpar presença" }, { status: 500 });
  }
}
