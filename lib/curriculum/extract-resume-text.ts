import mammoth from 'mammoth';
import { extractText as extractPdfText } from 'unpdf';
import WordExtractor from 'word-extractor';
import {
  detectResumeFormat,
  looksLikeResumeFile,
  validateResumeUploadMeta,
} from '@/lib/curriculum/validate-resume-file';
import { parseResumePatterns } from '@/lib/curriculum/parse-resume-patterns';
import type { ResumeAllowedMime, ResumeExtractionResult } from '@/lib/curriculum/types';

function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  // Páginas separadas por quebra de linha melhoram o reconhecimento de padrões
  const { text } = await extractPdfText(new Uint8Array(buffer), { mergePages: false });
  if (Array.isArray(text)) return text.filter(Boolean).join('\n\n');
  return String(text || '');
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
}

async function extractFromDoc(buffer: Buffer): Promise<string> {
  if (buffer.subarray(0, 2).toString('ascii') === 'PK') {
    return extractFromDocx(buffer);
  }
  const extractor = new WordExtractor();
  const doc = await extractor.extract(buffer);
  return [doc.getBody(), doc.getHeaders(), doc.getFooters()].filter(Boolean).join('\n\n');
}

/**
 * Extrai texto do currículo em memória e aplica padrões para estruturar campos.
 * Não grava arquivo nem dados no banco.
 */
export async function extractResumeText(params: {
  fileName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}): Promise<ResumeExtractionResult> {
  const meta = validateResumeUploadMeta({
    fileName: params.fileName,
    mimeType: params.mimeType,
    size: params.size,
  });
  if (!meta.ok) {
    throw new Error(meta.error);
  }

  const mime: ResumeAllowedMime = meta.mime;
  if (!looksLikeResumeFile(params.buffer, mime)) {
    throw new Error('Conteúdo do arquivo não corresponde a PDF/DOC/DOCX válido.');
  }

  const format = detectResumeFormat(mime);
  let raw = '';

  if (format === 'pdf') {
    raw = await extractFromPdf(params.buffer);
  } else if (format === 'docx') {
    raw = await extractFromDocx(params.buffer);
  } else {
    raw = await extractFromDoc(params.buffer);
  }

  const rawText = normalizeExtractedText(raw);
  if (!rawText) {
    throw new Error('Não foi possível extrair texto deste arquivo. Tente outro currículo.');
  }

  const structured = parseResumePatterns(rawText);

  return {
    sourceFileName: params.fileName.replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 160),
    mimeType: mime,
    format,
    rawText,
    charCount: rawText.length,
    extractedAt: new Date().toISOString(),
    structured,
  };
}
