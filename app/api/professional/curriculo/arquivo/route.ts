import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadOwnedResume } from "@/lib/jobs/job-application-mail";
import { jsonError } from "@/lib/jobs/job-api";
import { requireCurrentProfessional } from "@/lib/professional/current-professional";
import { extractStoragePath } from "@/lib/storage/private-uploads";

/** Baixa o currículo do profissional autenticado. Não aceita caminho informado pelo navegador. */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireCurrentProfessional(request);
    if (!auth.ok) return auth.response;

    const profile = await prisma.profile.findUnique({
      where: { userId: auth.user.id },
      select: { curricoURL: true },
    });
    const stored = profile?.curricoURL || "";
    const path = stored.includes("://") ? extractStoragePath(stored) || stored : stored;
    const resume = await loadOwnedResume(auth.user.email, path);

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
