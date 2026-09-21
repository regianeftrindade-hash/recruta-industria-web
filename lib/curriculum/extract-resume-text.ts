import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import mammoth from 'mammoth';
import { extractText, extractTextItems, getDocumentProxy } from 'unpdf';
import WordExtractor from 'word-extractor';
import JSZip from 'jszip';
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

/** Fontes/cMaps do pdfjs — sem isso, PDFs com fontes CID (Word/Canva) saem vazios. */
function pdfjsNodeAssets(): {
  disableFontFace: boolean;
  standardFontDataUrl: string;
  cMapUrl: string;
  cMapPacked: boolean;
} | null {
  const candidates = [
    path.join(process.cwd(), 'node_modules', 'pdfjs-dist'),
    path.join(process.cwd(), 'node_modules', 'unpdf', 'node_modules', 'pdfjs-dist'),
  ];

  for (const root of candidates) {
    if (!fs.existsSync(path.join(root, 'package.json'))) continue;
    const fonts = path.join(root, 'standard_fonts');
    const cmaps = path.join(root, 'cmaps');
    if (!fs.existsSync(fonts) || !fs.existsSync(cmaps)) continue;
    return {
      disableFontFace: true,
      standardFontDataUrl: `${pathToFileURL(fonts).href}/`,
      cMapUrl: `${pathToFileURL(cmaps).href}/`,
      cMapPacked: true,
    };
  }

  return null;
}

function bytesFromBuffer(buffer: Buffer): Uint8Array {
  // Cópia independente — evita problemas de view/SharedArrayBuffer no PDF.js
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return copy;
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  const data = bytesFromBuffer(buffer);
  const assets = pdfjsNodeAssets();
  if (!assets) {
    console.error(
      '[curriculum] pdfjs-dist cmaps/fonts ausentes em',
      process.cwd(),
      '— PDFs com fontes CID podem sair vazios',
    );
  }
  const pdf = await getDocumentProxy(data, assets || undefined);

  try {
    const { text } = await extractText(pdf, { mergePages: true });
    let raw = '';
    if (typeof text === 'string') {
      raw = text;
    } else if (Array.isArray(text)) {
      raw = (text as string[]).join('\n\n');
    }

    if (!normalizeExtractedText(raw)) {
      const { items } = await extractTextItems(pdf);
      raw = items
        .flatMap((page) => page.map((item) => item.str))
        .filter(Boolean)
        .join('\n');
    }

    return raw;
  } finally {
    await pdf.destroy().catch(() => undefined);
  }
}

function decodeXmlText(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Lê parágrafos do XML do Word (tabelas, caixas de texto e cabeçalho). */
function docxXmlToText(xml: string): string {
  // Quebra célula de tabela para não colar "CidadeCuritibaEstadoPR"
  const normalized = xml.replace(/<\/w:tc>/gi, '</w:tc>\n').replace(/<\/w:p>/gi, '</w:p>\n');
  return normalized
    .split(/\n+/)
    .map((paragraph) => {
      const bits = [...paragraph.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/gi)].map((m) =>
        decodeXmlText(m[1]),
      );
      return bits.join('').replace(/\s+/g, ' ').trim();
    })
    .filter(Boolean)
    .join('\n');
}

async function extractDocxXmlParts(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files)
    .filter((name) => /^word\/(document|header\d+|footer\d+|footnotes|endnotes)\.xml$/i.test(name))
    .sort((a, b) => {
      // Cabeçalho primeiro — endereço costuma estar lá
      const rank = (n: string) => (n.includes('header') ? 0 : n.includes('document') ? 1 : 2);
      return rank(a) - rank(b) || a.localeCompare(b);
    });
  const chunks: string[] = [];
  for (const name of names) {
    const file = zip.files[name];
    if (!file || file.dir) continue;
    const xml = await file.async('string');
    const text = docxXmlToText(xml);
    if (text) chunks.push(text);
  }
  return chunks.join('\n');
}

function mergeResumeTexts(...parts: string[]): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const part of parts) {
    for (const line of String(part || '')
      .split(/\n+/)
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .filter(Boolean)) {
      const key = line.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(line);
    }
  }
  return lines.join('\n');
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const [mammothText, xmlText] = await Promise.all([
    mammoth.extractRawText({ buffer }).then((result) => result.value || ''),
    extractDocxXmlParts(buffer).catch(() => ''),
  ]);
  // Une as duas fontes: mammoth (corpo) + XML (cabeçalho/tabela/caixa)
  return mergeResumeTexts(xmlText, mammothText);
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

  try {
    if (format === 'pdf') {
      raw = await extractFromPdf(params.buffer);
    } else if (format === 'docx') {
      raw = await extractFromDocx(params.buffer);
    } else {
      raw = await extractFromDoc(params.buffer);
    }
  } catch (error) {
    console.error('Falha na biblioteca de extração:', error);
    throw new Error(
      'Não foi possível ler este arquivo. Tente exportar de novo em PDF ou DOCX.',
    );
  }

  const rawText = normalizeExtractedText(raw);
  if (!rawText) {
    throw new Error(
      format === 'pdf'
        ? 'Este PDF não tem texto selecionável (pode ser escaneado/imagem). Salve do Word como DOCX ou PDF com texto e tente de novo.'
        : 'Não foi possível extrair texto deste arquivo. Tente outro currículo.',
    );
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
