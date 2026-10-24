import { NextRequest, NextResponse } from "next/server";
import { requireCurrentProfessional } from "@/lib/professional/current-professional";
import { JobPostingError } from "@/lib/jobs/job-posting";
import { isFavoriteJob, listFavoriteJobs, setFavoriteJob } from "@/lib/jobs/job-favorites";

export async function GET(request: NextRequest) {
  const auth = await requireCurrentProfessional(request);
  if (!auth.ok) return auth.response;
  const jobId = request.nextUrl.searchParams.get("jobId");
  try {
    if (jobId) {
      return NextResponse.json({ favorited: await isFavoriteJob(auth.user.id, jobId) });
    }
    const jobs = await listFavoriteJobs(auth.user.id);
    return NextResponse.json({ ids: jobs.map((job) => job.id), jobs });
  } catch (error) {
    if (error instanceof JobPostingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("favoritos profissional", error);
    return NextResponse.json({ error: "Não foi possível carregar os favoritos." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireCurrentProfessional(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const jobId = typeof body?.jobId === "string" ? body.jobId : "";
  const favorited = body?.favorited === true;
  try {
    const saved = await setFavoriteJob(auth.user.id, jobId, favorited);
    return NextResponse.json({ favorited: saved });
  } catch (error) {
    if (error instanceof JobPostingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("favoritos profissional", error);
    return NextResponse.json({ error: "Não foi possível salvar o favorito." }, { status: 500 });
  }
}
