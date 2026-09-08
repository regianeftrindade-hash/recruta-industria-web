import { NextRequest, NextResponse } from "next/server";
import { resolveAuthEmail } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { applyCoreSchema } from "@/lib/infra/ensure-db-schema";
import {
  ensureProfilePublicSlug,
  resolveProfileIdFromParam,
} from "@/lib/profile/resolve-profile-ref";

/** Resolve slug ou id antigo → { profileId, slug }. */
export async function GET(request: NextRequest) {
  try {
    await applyCoreSchema();
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: auth.email } });
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const ref = request.nextUrl.searchParams.get("ref") || "";
    const profileId = await resolveProfileIdFromParam(ref);
    if (!profileId) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        publicSlug: true,
        title: true,
        cargoDesejado: true,
        cidade: true,
        estado: true,
      },
    });
    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const slug = await ensureProfilePublicSlug(profile);
    return NextResponse.json({ profileId: profile.id, slug });
  } catch (err) {
    console.error("[professionals/resolve]", err);
    return NextResponse.json({ error: "Erro ao resolver perfil" }, { status: 500 });
  }
}
