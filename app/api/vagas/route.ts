import { NextResponse } from "next/server";
import { listPublicJobs } from "@/lib/jobs/job-posting-db";
import { jsonError } from "@/lib/jobs/job-api";

export async function GET() {
  try {
    const jobs = await listPublicJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    return jsonError(error, "Não foi possível carregar as vagas.");
  }
}
