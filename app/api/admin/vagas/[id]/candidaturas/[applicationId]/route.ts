import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdminUser } from "@/lib/jobs/job-api";
import { updateAdminApplicationStage } from "@/lib/jobs/job-posting-db";

type Context = { params: Promise<{ id: string; applicationId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const access = await requireAdminUser(request);
  if (access.denied) return access.denied;

  try {
    const { id, applicationId } = await params;
    const body = await request.json().catch(() => null);
    const stage = body && typeof body === "object" && "stage" in body ? body.stage : null;
    const application = await updateAdminApplicationStage(id, applicationId, stage);
    return NextResponse.json({ application });
  } catch (error) {
    return jsonError(error, "Não foi possível atualizar a etapa do candidato.");
  }
}
