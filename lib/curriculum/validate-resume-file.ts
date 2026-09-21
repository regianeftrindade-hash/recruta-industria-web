import {
  RESUME_ALLOWED_MIME,
  RESUME_MAX_BYTES,
  type ResumeAllowedMime,
} from '@/lib/curriculum/types';

const EXT_BY_MIME: Record<ResumeAllowedMime, string[]> = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const MIME_BY_EXT: Record<string, ResumeAllowedMime> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const GENERIC_MIME = new Set(['', 'application/octet-stream', 'binary/octet-stream']);

function extensionOf(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  if (idx < 0) return '';
  return fileName.slice(idx).toLowerCase();
}

export function isResumeAllowedMime(mime: string): mime is ResumeAllowedMime {
  return (RESUME_ALLOWED_MIME as readonly string[]).includes(mime);
}

/** Inferência segura: extensão decide o tipo; MIME genérico do browser é aceito. */
function resolveResumeMime(fileName: string, mimeType: string): ResumeAllowedMime | null {
  const ext = extensionOf(fileName);
  const fromExt = MIME_BY_EXT[ext];
  if (!fromExt) return null;

  const mime = String(mimeType || '').toLowerCase().trim();
  if (GENERIC_MIME.has(mime)) return fromExt;
  if (!isResumeAllowedMime(mime)) return null;
  if (!EXT_BY_MIME[mime].includes(ext)) return null;
  return mime;
}

/** Valida MIME declarado, extensão e tamanho (antes de ler o buffer). */
export function validateResumeUploadMeta(params: {
  fileName: string;
  mimeType: string;
  size: number;
}): { ok: true; mime: ResumeAllowedMime } | { ok: false; error: string } {
  const name = String(params.fileName || '').trim();

  if (!name) {
    return { ok: false, error: 'Nome do arquivo inválido.' };
  }

  const mime = resolveResumeMime(name, params.mimeType);
  if (!mime) {
    return { ok: false, error: 'Aceitamos apenas PDF, DOC ou DOCX.' };
  }

  if (!params.size || params.size <= 0) {
    return { ok: false, error: 'Arquivo vazio.' };
  }

  if (params.size > RESUME_MAX_BYTES) {
    return { ok: false, error: 'Arquivo muito grande (máx. 8 MB).' };
  }

  return { ok: true, mime };
}

/** Verifica assinatura mágica do arquivo (anti-upload de executável renomeado). */
export function looksLikeResumeFile(buffer: Buffer, mime: ResumeAllowedMime): boolean {
  if (buffer.length < 4) return false;

  if (mime === 'application/pdf') {
    return buffer.subarray(0, 4).toString('ascii') === '%PDF';
  }

  // DOCX = ZIP (PK)
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return buffer.subarray(0, 2).toString('ascii') === 'PK';
  }

  // DOC antigo = OLE Compound File (D0 CF 11 E0) ou, raramente, ZIP se vier mal tipado
  if (mime === 'application/msword') {
    const ole =
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0;
    const zip = buffer.subarray(0, 2).toString('ascii') === 'PK';
    return ole || zip;
  }

  return false;
}

export function detectResumeFormat(mime: ResumeAllowedMime): 'pdf' | 'docx' | 'doc' {
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'docx';
  }
  return 'doc';
}
