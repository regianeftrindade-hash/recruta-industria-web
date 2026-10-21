import { sanitizeUploadOwnerPrefix } from "@/lib/storage/private-uploads";

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export const RESUME_REQUIRED_MESSAGE =
  "Para se candidatar a esta vaga por e-mail, anexe seu currículo em PDF ao seu perfil.";

export function isPdfBuffer(buffer: Uint8Array, maxBytes = MAX_RESUME_BYTES): boolean {
  if (buffer.length < 5 || buffer.length > maxBytes) return false;
  const head = Buffer.from(buffer.subarray(0, 5)).toString("ascii");
  return head === "%PDF-";
}

export function resumePathOwnedBy(path: string, email: string): boolean {
  const clean = path.replace(/^\/+/, "").split("?")[0];
  if (!clean || clean.includes("..") || clean.includes("\\") || clean.includes("://")) return false;
  const owner = sanitizeUploadOwnerPrefix(email).toLowerCase();
  if (!owner) return false;
  const prefix = `curriculos/${owner}/`;
  return clean.toLowerCase().startsWith(prefix);
}
