import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { enviarMensagemParaPerfil } from "@/lib/profile-messages";
import { notifyProfessionalAsync, notifyMessageReceived } from "@/lib/professional-notifications";

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

export async function POST(request: NextRequest) {
  try {
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

    const unlocked = await prisma.accessRecord.findFirst({
      where: {
        profileId,
        companyUserId: companyUser.id,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    });

    if (!unlocked) {
      return NextResponse.json(
        { error: "Libere o contato do profissional antes de enviar mensagem." },
        { status: 403 }
      );
    }

    const companyName = companyUser.company?.name || companyUser.name || "Empresa";

    const mensagem = await enviarMensagemParaPerfil(
      companyUser.id,
      companyName,
      profileId,
      texto
    );

    notifyProfessionalAsync(() =>
      notifyMessageReceived(profileId, companyName, texto)
    );

    return NextResponse.json({
      success: true,
      message: {
        id: mensagem.id,
        createdAt: mensagem.createdAt.toISOString(),
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
