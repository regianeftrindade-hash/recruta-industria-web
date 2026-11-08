import { NextRequest, NextResponse } from "next/server";
import { createManualAdminJob, listManualJobApplications } from "@/lib/jobs/job-posting-db";
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

export async function POST(request: NextRequest) {
  const access = await requireAdminUser(request);
  if (access.denied) return access.denied;
  if (!access.userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  try {
    const created = await createManualAdminJob(access.userId, body);
    return NextResponse.json({ ok: true, id: created.id });
  } catch (error) {
    return jsonError(error, "Não foi possível cadastrar a vaga.");
  }
}
