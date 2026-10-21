import { NextRequest, NextResponse } from "next/server";
import { deleteAdminJob, updateAdminJob } from "@/lib/jobs/job-posting-db";
import { jsonError, requireAdminUser } from "@/lib/jobs/job-api";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const access = await requireAdminUser(request);
  if (access.denied) return access.denied;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const job = await updateAdminJob(id, body);
    return NextResponse.json({ job });
  } catch (error) {
    return jsonError(error, "Não foi possível atualizar a vaga.");
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const access = await requireAdminUser(request);
  if (access.denied) return access.denied;

  try {
    const { id } = await params;
    await deleteAdminJob(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível excluir a vaga.");
  }
}
