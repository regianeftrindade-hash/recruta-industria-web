import { NextResponse } from "next/server";
import { parseJobSearch } from "@/lib/jobs/job-search";
import { searchPublicJobs } from "@/lib/jobs/job-posting-db";
import { jsonError } from "@/lib/jobs/job-api";

export async function GET(request: Request) {
  try {
    const filters = parseJobSearch(new URL(request.url).searchParams);
    const jobs = await searchPublicJobs(filters);
    return NextResponse.json({ jobs, total: jobs.length });
  } catch (error) {
    return jsonError(error, "Não foi possível carregar as vagas.");
  }
}
