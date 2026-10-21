import { NextRequest, NextResponse } from "next/server";
import { createAdminJob, listAdminJobs } from "@/lib/jobs/job-posting-db";
import { jsonError, requireAdminUser } from "@/lib/jobs/job-api";

export async function GET(request: NextRequest) {
  const access = await requireAdminUser(request);
  if (access.denied) return access.denied;

  try {
    const jobs = await listAdminJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    return jsonError(error, "Não foi possível carregar as vagas.");
  }
}

export async function POST(request: NextRequest) {
  const access = await requireAdminUser(request);
  if (!access.userId) {
    return access.denied ?? NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const job = await createAdminJob(access.userId, body);
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return jsonError(error, "Não foi possível salvar a vaga.");
  }
}
