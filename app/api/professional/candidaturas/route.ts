import { NextRequest, NextResponse } from "next/server";
import { resolveAuthEmail } from "@/lib/api-auth";
import { JobPostingError } from "@/lib/jobs/job-posting";
import { listOwnJobApplications } from "@/lib/jobs/job-posting-db";

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const applications = await listOwnJobApplications(auth.email);
    return NextResponse.json({ applications });
  } catch (error) {
    if (error instanceof JobPostingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erro ao listar candidaturas do profissional:", error);
    return NextResponse.json({ error: "Erro ao listar candidaturas" }, { status: 500 });
  }
}
