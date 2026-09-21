import { describe, expect, it } from 'vitest';
import {
  looksLikeResumeFile,
  validateResumeUploadMeta,
} from '@/lib/curriculum/validate-resume-file';

describe('validate-resume-file', () => {
  it('aceita PDF/DOC/DOCX com extensão coerente', () => {
    expect(
      validateResumeUploadMeta({
        fileName: 'cv.pdf',
        mimeType: 'application/pdf',
        size: 1024,
      }).ok,
    ).toBe(true);
    expect(
      validateResumeUploadMeta({
        fileName: 'cv.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 2048,
      }).ok,
    ).toBe(true);
    expect(
      validateResumeUploadMeta({
        fileName: 'cv.doc',
        mimeType: 'application/msword',
        size: 2048,
      }).ok,
    ).toBe(true);
  });

  it('aceita MIME genérico do browser quando a extensão é válida', () => {
    const r = validateResumeUploadMeta({
      fileName: 'cv.docx',
      mimeType: 'application/octet-stream',
      size: 2048,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.mime).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    }
  });

  it('rejeita tipo/extensão inválidos e arquivo grande', () => {
    expect(
      validateResumeUploadMeta({
        fileName: 'malware.exe',
        mimeType: 'application/pdf',
        size: 100,
      }).ok,
    ).toBe(false);
    expect(
      validateResumeUploadMeta({
        fileName: 'foto.png',
        mimeType: 'image/png',
        size: 100,
      }).ok,
    ).toBe(false);
    expect(
      validateResumeUploadMeta({
        fileName: 'cv.pdf',
        mimeType: 'application/pdf',
        size: 20 * 1024 * 1024,
      }).ok,
    ).toBe(false);
  });

  it('valida assinatura mágica básica', () => {
    expect(looksLikeResumeFile(Buffer.from('%PDF-1.4'), 'application/pdf')).toBe(true);
    expect(looksLikeResumeFile(Buffer.from('PK\u0003\u0004xxxx'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
    expect(looksLikeResumeFile(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0, 0]), 'application/msword')).toBe(true);
    expect(looksLikeResumeFile(Buffer.from('MZ........'), 'application/pdf')).toBe(false);
  });
});
