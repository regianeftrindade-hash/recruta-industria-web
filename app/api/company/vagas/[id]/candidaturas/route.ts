import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/jobs/job-api";
import { listJobApplicationsForCompany } from "@/lib/jobs/job-posting-db";
import { resolveCompanyPublisher } from "@/lib/jobs/company-publisher";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const access = await resolveCompanyPublisher(request);
  if ("error" in access) return access.error;

  try {
    const { id } = await params;
    const applications = await listJobApplicationsForCompany(id, access.ownerUserId);
    return NextResponse.json({ applications });
  } catch (error) {
    return jsonError(error, "Não foi possível carregar as candidaturas.");
  }
}
