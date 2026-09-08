import { NextRequest, NextResponse } from "next/server";
import { resolveAuthEmail } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { looksLikeProfileCuid } from "@/lib/profile/public-slug";
import { buildProfilePublicSlug } from "@/lib/profile/public-slug";

/** Resolve id (cuid) → { profileId, slug }. Sem depender de coluna no banco. */
export async function GET(request: NextRequest) {
  try {
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

    const ref = (request.nextUrl.searchParams.get("ref") || "").trim();
    if (!looksLikeProfileCuid(ref)) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: ref },
      select: {
        id: true,
        title: true,
        cargoDesejado: true,
        cidade: true,
        estado: true,
      },
    });
    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const slug = buildProfilePublicSlug({
      id: profile.id,
      title: profile.title,
      cargo: profile.cargoDesejado,
      city: profile.cidade,
      state: profile.estado,
    });

    return NextResponse.json({ profileId: profile.id, slug });
  } catch (err) {
    console.error("[professionals/resolve]", err);
    return NextResponse.json({ error: "Erro ao resolver perfil" }, { status: 500 });
  }
}
