import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { apiUnauthorizedResponse } from "@/lib/i18n/api-response";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return await apiUnauthorizedResponse();
    }

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    });

    if (!user?.profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const tip = await prisma.tip.findFirst({
      where: { id, profileId: user.profile.id },
    });

    if (!tip) {
      return NextResponse.json({ error: "Dica não encontrada" }, { status: 404 });
    }

    await prisma.tip.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir dica:", error);
    return NextResponse.json({ error: "Erro ao excluir dica" }, { status: 500 });
  }
}
