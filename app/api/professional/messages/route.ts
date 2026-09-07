import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import {
  excluirMensagemDoPerfil,
  listarMensagensDoPerfil,
  responderMensagemDaEmpresa,
} from "@/lib/profile-messages";
import { ensurePaymentSchema } from "@/lib/ensure-db-schema";
import {
  notifyCompanyMessageReply,
  notifyProfessionalAsync,
} from "@/lib/professional-notifications";

function limparTextoMensagem(raw: string): string {
  return raw
    .trim()
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .slice(0, 1000);
}

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

/** Responder mensagem da empresa. */
export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const replyToId = String(body?.replyToId ?? body?.messageId ?? "").trim();
    const texto = limparTextoMensagem(String(body?.body ?? body?.message ?? ""));

    if (!replyToId || !texto) {
      return NextResponse.json(
        { error: "Mensagem original e texto da resposta são obrigatórios" },
        { status: 400 },
      );
    }

    if (texto.length < 2) {
      return NextResponse.json({ error: "Resposta muito curta" }, { status: 400 });
    }

    const professionalName =
      user.name?.trim()
      || user.profile.title?.trim()
      || auth.name?.trim()
      || "Profissional";

    const reply = await responderMensagemDaEmpresa({
      profileId: user.profile.id,
      professionalName,
      replyToId,
      body: texto,
    });

    notifyProfessionalAsync(() =>
      notifyCompanyMessageReply({
        companyUserId: reply.companyUserId,
        professionalName: reply.professionalName,
        messageBody: reply.body,
      }),
    );

    return NextResponse.json({
      success: true,
      message: {
        id: reply.id,
        from: "Você",
        body: reply.body,
        createdAt: reply.createdAt.toISOString(),
        senderRole: "PROFESSIONAL",
        replyToId: reply.replyToId,
        companyUserId: reply.companyUserId,
        companyName: reply.companyName,
      },
    });
  } catch (error) {
    console.error("Erro ao responder mensagem:", error);
    const detail = error instanceof Error ? error.message : "Erro ao responder";
    return NextResponse.json(
      {
        error: detail.includes("não encontrada") || detail.includes("Só é possível")
          ? detail
          : "Erro ao responder mensagem",
      },
      { status: 400 },
    );
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
