import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/jobs/job-api";
import { updateCompanyApplicationStage } from "@/lib/jobs/job-posting-db";
import { resolveCompanyPublisher } from "@/lib/jobs/company-publisher";

type Context = { params: Promise<{ id: string; applicationId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const access = await resolveCompanyPublisher(request);
  if ("error" in access) return access.error;

  try {
    const { id, applicationId } = await params;
    const body = await request.json().catch(() => null);
    const stage = body && typeof body === "object" && "stage" in body ? body.stage : null;
    const application = await updateCompanyApplicationStage(
      access.ownerUserId,
      id,
      applicationId,
      stage,
    );
    return NextResponse.json({ application });
  } catch (error) {
    return jsonError(error, "Não foi possível atualizar a etapa do candidato.");
  }
}
