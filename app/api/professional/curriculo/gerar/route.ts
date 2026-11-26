import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeResumeModel, renderResumePdf, sanitizeResumeDraft } from "@/lib/curriculum/resume-draft";
import { saveResumeDraft } from "@/lib/curriculum/save-resume-draft";
import { requireCurrentProfessional } from "@/lib/professional/current-professional";
import { uploadPrivateFile, sanitizeUploadOwnerPrefix } from "@/lib/storage/private-uploads";
import { resolveInterfaceLocale } from "@/lib/i18n/resolve-interface-locale";
import { t } from "@/lib/i18n/translate";

export async function POST(request: NextRequest) {
  const auth = await requireCurrentProfessional(request);
  if (!auth.ok) return auth.response;
  const locale = await resolveInterfaceLocale();

  const body = await request.json().catch(() => null);
  const draft = sanitizeResumeDraft(body?.draft);
  if (!draft.nome) {
    return NextResponse.json(
      { error: t("internal.resume.nameRequired", locale) },
      { status: 400 },
    );
  }

  try {
    await saveResumeDraft(auth.user.id, auth.user.email, draft);
  } catch (error) {
    console.error("[curriculo] falha ao atualizar os dados do perfil", error);
    return NextResponse.json(
      { error: t("internal.resume.saveError", locale) },
      { status: 500 },
    );
  }

  const bytes = renderResumePdf(draft, normalizeResumeModel(body?.model), locale);
  const saveAsMain = body?.saveAsMain === true;
  if (!saveAsMain) {
    return pdfResponse(bytes, false);
  }

  try {
    const owner = sanitizeUploadOwnerPrefix(auth.user.email);
    const filePath = `curriculos/${owner}/${Date.now()}_curriculo.pdf`;
    await uploadPrivateFile(filePath, Buffer.from(bytes), "application/pdf");
    await prisma.profile.update({
      where: { userId: auth.user.id },
      data: { curricoURL: filePath },
    });
  } catch (error) {
    console.error("[curriculo] falha ao armazenar o PDF gerado", error);
    return NextResponse.json(
      { error: t("internal.resume.pdfNotSaved", locale) },
      { status: 502 },
    );
  }

  return pdfResponse(bytes, true);
}

function pdfResponse(bytes: Uint8Array, saved: boolean) {
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"curriculo.pdf\"",
      "X-Resume-Saved": saved ? "1" : "0",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
