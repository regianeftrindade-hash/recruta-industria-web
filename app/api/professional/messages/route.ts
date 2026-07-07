import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import {
  excluirMensagemDoPerfil,
  listarMensagensDoPerfil,
} from "@/lib/profile-messages";
import { ensurePaymentSchema } from "@/lib/ensure-db-schema";

export async function GET(request: NextRequest) {
  try {
    await ensurePaymentSchema();

    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      include: { profile: true },
    });

    if (!user?.profile) {
      return NextResponse.json({ messages: [] });
    }

    const messages = await listarMensagensDoPerfil(user.profile.id);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensurePaymentSchema();

    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      include: { profile: true },
    });

    if (!user?.profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("id");
    if (!messageId) {
      return NextResponse.json({ error: "ID da mensagem obrigatório" }, { status: 400 });
    }

    const ok = await excluirMensagemDoPerfil(user.profile.id, messageId);
    if (!ok) {
      return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir mensagem:", error);
    return NextResponse.json({ error: "Erro ao excluir mensagem" }, { status: 500 });
  }
}
