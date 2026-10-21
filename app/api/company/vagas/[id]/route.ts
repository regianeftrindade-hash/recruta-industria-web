import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/jobs/job-api";
import { updateCompanyJob } from "@/lib/jobs/job-posting-db";
import { resolveCompanyPublisher } from "@/lib/jobs/company-publisher";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const access = await resolveCompanyPublisher(request);
  if ("error" in access) return access.error;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const job = await updateCompanyJob(access.ownerUserId, id, body);
    return NextResponse.json({ job });
  } catch (error) {
    return jsonError(error, "Não foi possível atualizar a vaga.");
  }
}
