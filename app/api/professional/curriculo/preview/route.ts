import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/jobs/job-api";
import { renderResumePdf } from "@/lib/professional/resume-pdf";
import { buildResumeDocument } from "@/lib/professional/resume-document";
import { loadResumeActor } from "@/lib/professional/resume-owner";
import { enforceApiRateLimit, getClientIp } from "@/lib/security/api-guard";

/** Prévia do PDF com os dados já salvos. Não grava arquivo nem altera o perfil. */
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!(await enforceApiRateLimit(`curriculo-preview:${ip}`, 30, 60 * 60 * 1000))) {
      return NextResponse.json({ error: "Muitas prévias. Tente novamente mais tarde." }, { status: 429 });
    }

    const loaded = await loadResumeActor(request);
    if ("response" in loaded) return loaded.response;

    const document = buildResumeDocument(loaded.actor.source);
    const pdf = await renderResumePdf(document);
    return NextResponse.json({
      name: document.name,
      contacts: document.contacts,
      sections: document.sections,
      missing: document.missing,
      pdfBase64: Buffer.from(pdf).toString("base64"),
    });
  } catch (error) {
    return jsonError(error, "Não foi possível preparar a prévia do currículo.");
  }
}
