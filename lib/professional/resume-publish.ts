import { JobPostingError } from "@/lib/jobs/job-posting";
import { isPdfBuffer, resumePathOwnedBy } from "@/lib/jobs/resume-pdf";
import { sanitizeUploadOwnerPrefix } from "@/lib/storage/private-uploads";

export function resumeStoragePath(email: string, now = Date.now()): string {
  const owner = sanitizeUploadOwnerPrefix(email).toLowerCase();
  return `curriculos/${owner}/${now}_curriculo.pdf`;
}

/**
 * Grava o PDF e só então aponta o perfil para o caminho novo.
 * Falha no upload não chama a atualização. Falha na atualização não apaga o currículo anterior.
 */
export async function publishOwnedResume(input: {
  email: string;
  pdf: Uint8Array;
  upload: (path: string, bytes: Buffer) => Promise<void>;
  assignPath: (path: string) => Promise<void>;
  now?: number;
}): Promise<{ path: string }> {
  if (!isPdfBuffer(input.pdf)) {
    throw new JobPostingError("O currículo gerado não é um PDF válido.", 500, "RESUME_INVALID");
  }
  const path = resumeStoragePath(input.email, input.now);
  if (!resumePathOwnedBy(path, input.email)) {
    throw new JobPostingError("Não foi possível guardar o currículo neste perfil.", 403, "RESUME_OWNER");
  }

  await input.upload(path, Buffer.from(input.pdf));
  await input.assignPath(path);
  return { path };
}
