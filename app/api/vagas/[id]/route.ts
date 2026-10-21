import { NextResponse } from "next/server";
import { getPublicJob } from "@/lib/jobs/job-posting-db";
import { jsonError } from "@/lib/jobs/job-api";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const job = await getPublicJob(id);
    if (!job) {
      return NextResponse.json({ error: "Vaga não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch (error) {
    return jsonError(error, "Não foi possível carregar a vaga.");
  }
}
