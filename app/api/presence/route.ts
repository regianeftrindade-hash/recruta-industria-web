import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { getPresenceByProfileId } from "@/lib/presence";

/** Consulta se um profissional (por profileId) está online. */
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

    const profileId = String(request.nextUrl.searchParams.get("profileId") || "").trim();
    if (!profileId) {
      return NextResponse.json({ error: "Informe profileId" }, { status: 400 });
    }

    const presence = await getPresenceByProfileId(profileId);
    return NextResponse.json(presence);
  } catch (error) {
    console.error("Erro ao consultar presença:", error);
    return NextResponse.json({ error: "Erro ao consultar presença" }, { status: 500 });
  }
}
