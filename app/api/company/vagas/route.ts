import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/jobs/job-api";
import { resolveCompanyPublisher } from "@/lib/jobs/company-publisher";
import { createCompanyJob, listCompanyJobs } from "@/lib/jobs/job-posting-db";

export async function GET(request: NextRequest) {
  const access = await resolveCompanyPublisher(request);
  if ("error" in access) return access.error;

  try {
    const jobs = await listCompanyJobs(access.ownerUserId);
    return NextResponse.json({ jobs, companyName: access.companyName });
  } catch (error) {
    return jsonError(error, "Não foi possível carregar as vagas.");
  }
}

export async function POST(request: NextRequest) {
  const access = await resolveCompanyPublisher(request);
  if ("error" in access) return access.error;

  try {
    const body = await request.json().catch(() => null);
    const job = await createCompanyJob(access.ownerUserId, access.userId, body);
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return jsonError(error, "Não foi possível salvar a vaga.");
  }
}
