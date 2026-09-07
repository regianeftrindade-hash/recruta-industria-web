import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import {
  listReceivedProfileShares,
  markProfileShareRead,
  shareProfileWithTeam,
} from "@/lib/company/company-profile-share";

async function getCompanyUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  return prisma.user.findUnique({
    where: { email: auth.email },
  });
}

/** Lista perfis compartilhados comigo pela equipe do mesmo plano. */
export async function GET(request: NextRequest) {
  try {
    const user = await getCompanyUser(request);
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const shares = await listReceivedProfileShares(user.id);
    return NextResponse.json({ shares });
  } catch (error) {
    console.error("Erro ao listar compartilhamentos:", error);
    return NextResponse.json({ error: "Erro ao listar compartilhamentos" }, { status: 500 });
  }
}

/** Compartilha um perfil com colegas da mesma assinatura. */
export async function POST(request: NextRequest) {
  try {
    const user = await getCompanyUser(request);
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const profileId = String(body?.profileId || "").trim();
    const note = String(body?.note || "").trim();
    const toUserIds = Array.isArray(body?.toUserIds)
      ? body.toUserIds.map((id: unknown) => String(id || "").trim()).filter(Boolean)
      : [];

    if (!profileId) {
      return NextResponse.json({ error: "Informe o perfil" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const result = await shareProfileWithTeam({
      actorUserId: user.id,
      profileId,
      toUserIds,
      note,
      origin,
    });

    return NextResponse.json({
      success: true,
      ...result,
      message: `Perfil compartilhado com ${result.shared} pessoa(s) da equipe.`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    const map: Record<string, { status: number; error: string }> = {
      FORBIDDEN: { status: 403, error: "Sem permissão para compartilhar." },
      PROFILE_NOT_FOUND: { status: 404, error: "Profissional não encontrado." },
      NO_TARGETS: { status: 400, error: "Selecione pelo menos uma pessoa da equipe." },
      NO_VALID_TARGETS: {
        status: 400,
        error: "Só é possível compartilhar com pessoas do mesmo plano/assinatura.",
      },
    };
    if (map[msg]) {
      return NextResponse.json({ error: map[msg].error }, { status: map[msg].status });
    }
    console.error("Erro ao compartilhar perfil:", error);
    return NextResponse.json({ error: "Erro ao compartilhar perfil" }, { status: 500 });
  }
}

/** Marca compartilhamento como lido. */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCompanyUser(request);
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const shareId = String(body?.shareId || "").trim();
    if (!shareId) {
      return NextResponse.json({ error: "Informe shareId" }, { status: 400 });
    }

    await markProfileShareRead(user.id, shareId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao marcar compartilhamento:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
