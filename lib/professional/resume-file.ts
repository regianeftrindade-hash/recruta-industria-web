export const MAX_RESUME_FILE_BYTES = 10 * 1024 * 1024;

/** Vale no navegador e no servidor. Confere tamanho e a assinatura %PDF-. */
export function resumeFileProblem(bytes: Uint8Array, size = bytes.byteLength): string | null {
  if (size > MAX_RESUME_FILE_BYTES) return "O arquivo passa de 10 MB. Envie um PDF menor.";
  const head = new TextDecoder().decode(bytes.subarray(0, 5));
  if (head !== "%PDF-") return "Envie um arquivo que seja realmente um PDF.";
  return null;
}
