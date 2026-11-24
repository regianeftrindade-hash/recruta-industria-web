import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { getPresenceByProfileId } from "@/lib/presence";
import { apiUnauthorizedResponse, apiErrorResponse } from "@/lib/i18n/api-response";

/** Consulta se um profissional (por profileId) está online. */
export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return await apiUnauthorizedResponse();
    }
    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      select: { id: true, role: true },
    });
    if (!user || user.role !== "COMPANY") {
      return await apiErrorResponse("rest.api.companyOnly", 403);
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
