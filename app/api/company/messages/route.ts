import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import {
  enviarMensagemParaPerfil,
  excluirMensagemDaEmpresa,
  listarThreadEmpresaPerfil,
} from "@/lib/profile-messages";
import { canCompanyAccessSensitiveProfiles } from "@/lib/company-storage";
import { notifyProfessionalAsync, notifyMessageReceived } from "@/lib/professional-notifications";
import { ensurePaymentSchema } from "@/lib/ensure-db-schema";
import { resolveCompanyOwnerUserId } from "@/lib/company/company-team";

async function getCompanyUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;

  const user = await prisma.user.findUnique({
    where: { email: auth.email },
    include: { company: true },
  });

  if (!user || user.role !== "COMPANY") return null;
  return user;
}

async function resolveOwnerId(companyUserId: string) {
  return (await resolveCompanyOwnerUserId(companyUserId)) || companyUserId;
}

/** Lista a conversa com um profissional (mensagens + respostas). */
export async function GET(request: NextRequest) {
  try {
    await ensurePaymentSchema();
    const companyUser = await getCompanyUser(request);
    if (!companyUser) {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const profileId = request.nextUrl.searchParams.get("profileId")?.trim() || "";
    if (!profileId) {
      return NextResponse.json({ error: "profileId obrigatório" }, { status: 400 });
    }

    const ownerUserId = await resolveOwnerId(companyUser.id);

    const unlocked = await prisma.accessRecord.findFirst({
      where: {
        profileId,
        companyUserId: { in: [ownerUserId, companyUser.id] },
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    });

    if (!unlocked) {
      return NextResponse.json(
        { error: "Libere o contato do profissional para ver a conversa." },
        { status: 403 },
      );
    }

    const messages = await listarThreadEmpresaPerfil(ownerUserId, profileId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Erro ao listar mensagens:", error);
    return NextResponse.json({ error: "Erro ao listar mensagens" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensurePaymentSchema();
    const companyUser = await getCompanyUser(request);
    if (!companyUser) {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const body = await request.json();
    const profileId = String(body?.profileId ?? "").trim();
    const texto = String(body?.body ?? body?.message ?? "").trim();

    if (!profileId || !texto) {
      return NextResponse.json({ error: "Perfil e mensagem são obrigatórios" }, { status: 400 });
    }

    if (texto.length > 1000) {
      return NextResponse.json({ error: "Mensagem muito longa (máx. 1000 caracteres)" }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile || !profile.isVisible || profile.status !== "ACTIVE") {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const ownerUserId = await resolveOwnerId(companyUser.id);

    const unlocked = await prisma.accessRecord.findFirst({
      where: {
        profileId,
        companyUserId: { in: [ownerUserId, companyUser.id] },
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    });

    if (!unlocked) {
      return NextResponse.json(
        { error: "Libere o contato do profissional antes de enviar mensagem." },
        { status: 403 },
      );
    }

    if (!(await canCompanyAccessSensitiveProfiles(ownerUserId))) {
      return NextResponse.json(
        { error: "Confirme o e-mail corporativo e aguarde a aprovação do cartão CNPJ para enviar mensagens." },
        { status: 403 },
      );
    }

    const companyName = companyUser.company?.name || companyUser.name || "Empresa";

    const mensagem = await enviarMensagemParaPerfil(
      ownerUserId,
      companyName,
      profileId,
      texto,
    );

    notifyProfessionalAsync(() =>
      notifyMessageReceived(profileId, companyName, texto),
    );

    return NextResponse.json({
      success: true,
      message: {
        id: mensagem.id,
        createdAt: mensagem.createdAt.toISOString(),
        senderRole: "COMPANY",
      },
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    const detail = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      {
        error: "Erro ao enviar mensagem",
        detail: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensurePaymentSchema();
    const companyUser = await getCompanyUser(request);
    if (!companyUser) {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const messageId = request.nextUrl.searchParams.get("id")?.trim() || "";
    const profileId = request.nextUrl.searchParams.get("profileId")?.trim() || "";
    if (!messageId || !profileId) {
      return NextResponse.json({ error: "id e profileId são obrigatórios" }, { status: 400 });
    }

    const ownerUserId = await resolveOwnerId(companyUser.id);

    const ok =
      (await excluirMensagemDaEmpresa(ownerUserId, profileId, messageId)) ||
      (await excluirMensagemDaEmpresa(companyUser.id, profileId, messageId));

    if (!ok) {
      return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir mensagem (empresa):", error);
    return NextResponse.json({ error: "Erro ao excluir mensagem" }, { status: 500 });
  }
}
