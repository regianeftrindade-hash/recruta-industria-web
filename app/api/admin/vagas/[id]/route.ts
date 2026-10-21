import { NextRequest, NextResponse } from "next/server";
import { updateAdminJob } from "@/lib/jobs/job-posting-db";
import { jsonError, requireAdminUser } from "@/lib/jobs/job-api";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const access = await requireAdminUser(request);
  if (access.denied) return access.denied;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const job = await updateAdminJob(id, body);
    return NextResponse.json({ job });
  } catch (error) {
    return jsonError(error, "Não foi possível atualizar a vaga.");
  }
}
