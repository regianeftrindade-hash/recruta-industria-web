import { NextRequest, NextResponse } from "next/server";
import { listManualJobApplications } from "@/lib/jobs/job-posting-db";
import { jsonError, requireAdminUser } from "@/lib/jobs/job-api";

export async function GET(request: NextRequest) {
  const access = await requireAdminUser(request);
  if (access.denied) return access.denied;

  try {
    const data = await listManualJobApplications();
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error, "Não foi possível carregar as candidaturas manuais.");
  }
}
