import { NextRequest, NextResponse } from "next/server";
import { resolveAuthEmail } from "@/lib/auth/api-auth";
import { getOwnApplicationState } from "@/lib/jobs/job-posting-db";
import { jsonError } from "@/lib/jobs/job-api";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const auth = await resolveAuthEmail(request);
    const state = await getOwnApplicationState(id, auth?.email ?? null);
    return NextResponse.json(state);
  } catch (error) {
    return jsonError(error, "Não foi possível consultar a candidatura.");
  }
}
