import { NextRequest, NextResponse } from "next/server";
import { listJobApplicationsForAdmin } from "@/lib/jobs/job-posting-db";
import { jsonError, requireAdminUser } from "@/lib/jobs/job-api";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const access = await requireAdminUser(request);
  if (access.denied) return access.denied;

  try {
    const { id } = await params;
    const applications = await listJobApplicationsForAdmin(id);
    return NextResponse.json({ applications });
  } catch (error) {
    return jsonError(error, "Não foi possível carregar as candidaturas.");
  }
}
