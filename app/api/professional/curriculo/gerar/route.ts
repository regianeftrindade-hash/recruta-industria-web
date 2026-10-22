import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/jobs/job-api";
import { JobPostingError } from "@/lib/jobs/job-posting";
import { buildResumeDocument } from "@/lib/professional/resume-document";
import { loadResumeActor } from "@/lib/professional/resume-owner";
import { renderResumePdf } from "@/lib/professional/resume-pdf";
import { publishOwnedResume } from "@/lib/professional/resume-publish";
import { enforceApiRateLimit, getClientIp } from "@/lib/security/api-guard";
import { uploadPrivateFile } from "@/lib/storage/private-uploads";

/** Gera o PDF, guarda no bucket privado e só então atualiza Profile.curricoURL. */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!(await enforceApiRateLimit(`curriculo-gerar:${ip}`, 20, 60 * 60 * 1000))) {
      return NextResponse.json({ error: "Muitas gerações. Tente novamente mais tarde." }, { status: 429 });
    }

    const loaded = await loadResumeActor(request);
    if ("response" in loaded) return loaded.response;
    const actor = loaded.actor;

    const document = buildResumeDocument(actor.source);
    const pdf = await renderResumePdf(document);
    const saved = await publishOwnedResume({
      email: actor.email,
      pdf,
      upload: async (path, bytes) => {
        await uploadPrivateFile(path, bytes, "application/pdf");
      },
      assignPath: async (path) => {
        if (actor.profileId) {
          await prisma.profile.update({
            where: { id: actor.profileId },
            data: { curricoURL: path },
          });
          return;
        }
        await prisma.profile.create({
          data: {
            userId: actor.userId,
            title: "Profissional",
            location: "Não informado",
            email: actor.email,
            curricoURL: path,
          },
        });
      },
    });

    return NextResponse.json({ ok: true, path: saved.path });
  } catch (error) {
    if (error instanceof JobPostingError) {
      return jsonError(error, "Não foi possível salvar o currículo.");
    }
    console.error("[curriculo] falha ao gerar ou gravar o pdf");
    return NextResponse.json(
      { error: "Não foi possível salvar o currículo. O arquivo anterior do perfil foi mantido." },
      { status: 500 },
    );
  }
}
