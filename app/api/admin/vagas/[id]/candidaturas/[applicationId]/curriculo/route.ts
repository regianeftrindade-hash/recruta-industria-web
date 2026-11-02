import { NextRequest, NextResponse } from "next/server";
import { readAdminApplicationResume } from "@/lib/jobs/job-posting-db";
import { jsonError, requireAdminUser } from "@/lib/jobs/job-api";

type Context = { params: Promise<{ id: string; applicationId: string }> };

/** Baixa o currículo gravado na candidatura. O caminho não vem do navegador. */
export async function GET(request: NextRequest, { params }: Context) {
  const access = await requireAdminUser(request);
  if (access.denied) return access.denied;

  try {
    const { id, applicationId } = await params;
    const resume = await readAdminApplicationResume(id, applicationId);
    return new NextResponse(new Uint8Array(resume.bytes), {
      headers: {
        "Content-Type": resume.contentType,
        "Content-Disposition": `inline; filename="${resume.filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return jsonError(error, "Não foi possível abrir o currículo.");
  }
}
