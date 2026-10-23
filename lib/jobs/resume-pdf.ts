import { sanitizeUploadOwnerPrefix } from "@/lib/storage/private-uploads";

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export const RESUME_REQUIRED_MESSAGE =
  "Para o envio automático, anexe um currículo em PDF ou DOCX ao seu perfil.";

export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function isPdfBuffer(buffer: Uint8Array, maxBytes = MAX_RESUME_BYTES): boolean {
  if (buffer.length < 5 || buffer.length > maxBytes) return false;
  const head = Buffer.from(buffer.subarray(0, 5)).toString("ascii");
  return head === "%PDF-";
}

export function isDocxBuffer(buffer: Uint8Array, maxBytes = MAX_RESUME_BYTES): boolean {
  if (buffer.length < 4 || buffer.length > maxBytes) return false;
  if (Buffer.from(buffer.subarray(0, 2)).toString("ascii") !== "PK") return false;
  const sample = Buffer.from(buffer).toString("latin1");
  return sample.includes("word/document.xml");
}

export function resumeFormatFromName(path: string): "pdf" | "docx" | null {
  const clean = path.split("?")[0].split("#")[0].toLowerCase();
  if (clean.endsWith(".pdf")) return "pdf";
  if (clean.endsWith(".docx")) return "docx";
  return null;
}

export function savedResumeLabel(path: string | null | undefined, email: string): string | null {
  const raw = path?.trim() || "";
  if (!raw || !resumePathOwnedBy(raw, email)) return null;
  const format = resumeFormatFromName(raw);
  if (format === "pdf") return "Currículo em PDF";
  if (format === "docx") return "Currículo em DOCX";
  return null;
}

/** Nome visível do arquivo do próprio profissional, sem a pasta nem o e-mail. */
export function savedResumeFileName(path: string | null | undefined, email: string): string | null {
  if (!savedResumeLabel(path, email)) return null;
  const base = String(path).split("?")[0].split("#")[0].split("/").pop() || "";
  const cleaned = base.replace(/^\d+_/, "").replace(/_+/g, " ").trim();
  return cleaned || savedResumeLabel(path, email);
}

export function resumePathOwnedBy(path: string, email: string): boolean {
  const clean = path.replace(/^\/+/, "").split("?")[0];
  if (!clean || clean.includes("..") || clean.includes("\\") || clean.includes("://")) return false;
  const owner = sanitizeUploadOwnerPrefix(email).toLowerCase();
  if (!owner) return false;
  const prefix = `curriculos/${owner}/`;
  return clean.toLowerCase().startsWith(prefix);
}
