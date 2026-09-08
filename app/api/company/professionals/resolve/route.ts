import { NextRequest, NextResponse } from "next/server";
import { resolveAuthEmail } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import {
  ensureProfilePublicSlug,
  ensurePublicSlugColumn,
  resolveProfileIdFromParam,
} from "@/lib/profile/resolve-profile-ref";
import { buildProfilePublicSlug } from "@/lib/profile/public-slug";

/** Resolve slug ou id antigo → { profileId, slug }. */
export async function GET(request: NextRequest) {
  try {
    await ensurePublicSlugColumn();
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      select: { id: true, role: true },
    });
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const ref = request.nextUrl.searchParams.get("ref") || "";
    const profileId = await resolveProfileIdFromParam(ref);
    if (!profileId) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    let slug = buildProfilePublicSlug({ id: profileId });
    try {
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
      if (profile) {
        slug = await ensureProfilePublicSlug(profile);
      }
    } catch (err) {
      console.warn("[professionals/resolve] slug", err);
    }

    return NextResponse.json({ profileId, slug });
  } catch (err) {
    console.error("[professionals/resolve]", err);
    const detail = err instanceof Error ? err.message : "erro desconhecido";
    return NextResponse.json(
      {
        error: "Erro ao resolver perfil",
        detail: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 },
    );
  }
}
