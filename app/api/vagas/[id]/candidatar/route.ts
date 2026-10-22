import { NextRequest, NextResponse } from "next/server";
import { resolveAuthEmail } from "@/lib/auth/api-auth";
import { registerJobApplication } from "@/lib/jobs/job-posting-db";
import { jsonError } from "@/lib/jobs/job-api";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const auth = await resolveAuthEmail(request);
    if (!auth?.email) {
      return NextResponse.json(
        { error: "Entre com uma conta de profissional para se candidatar." },
        { status: 401 },
      );
    }

    const application = await registerJobApplication(id, auth.email);
    return NextResponse.json({
      ok: true,
      message: application.message,
      whatsappUrl: "whatsappUrl" in application ? application.whatsappUrl : null,
      application: {
        id: application.id,
        jobId: application.jobId,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    return jsonError(error, "Não foi possível registrar a candidatura.");
  }
}
