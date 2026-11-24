import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import { listScheduledInterviewsForCompany } from "@/lib/company/job-proposals";
import { resolveCompanyOwnerUserId } from "@/lib/company/company-team";
import { apiUnauthorizedResponse, apiErrorResponse } from "@/lib/i18n/api-response";

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

    const ownerUserId = (await resolveCompanyOwnerUserId(user.id)) || user.id;
    const interviews = await listScheduledInterviewsForCompany(ownerUserId);
    return NextResponse.json({ interviews });
  } catch (error) {
    console.error("Erro ao listar entrevistas agendadas:", error);
    return NextResponse.json({ error: "Erro ao listar entrevistas" }, { status: 500 });
  }
}
