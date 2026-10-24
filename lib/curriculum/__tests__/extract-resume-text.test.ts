import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { extractResumeText, mensagemFalhaExtracao } from '@/lib/curriculum/extract-resume-text';

describe('extractResumeText (PDF)', () => {
  it('extrai texto de PDF com camada de texto', async () => {
    const res = await fetch(
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    );
    expect(res.ok).toBe(true);
    const buffer = Buffer.from(await res.arrayBuffer());

    const result = await extractResumeText({
      fileName: 'dummy.pdf',
      mimeType: 'application/pdf',
      size: buffer.length,
      buffer,
    });

    expect(result.format).toBe('pdf');
    expect(result.rawText.toLowerCase()).toContain('dummy');
    expect(result.charCount).toBeGreaterThan(0);
  }, 30_000);

  it('extrai campos de PDF de currículo local', async () => {
    const fixture = join(__dirname, 'fixtures', 'cv-teste.pdf');
    if (!existsSync(fixture)) return;

    const buffer = readFileSync(fixture);
    const result = await extractResumeText({
      fileName: 'cv-teste.pdf',
      mimeType: 'application/pdf',
      size: buffer.length,
      buffer,
    });

    expect(result.rawText).toMatch(/Maria Silva/i);
    expect(result.structured.contato?.email).toMatch(/maria\.silva@email\.com/i);
    expect(result.structured.cursoFormacao).toMatch(/Engenharia Mecanica/i);
    expect(result.structured.experiencias?.[0]?.cargo).toMatch(/Soldador/i);
    expect(result.structured.experiencias?.[0]?.empresa).toMatch(/XYZ/i);
  });

  it('explica PDF corrompido e PDF protegido por senha', async () => {
    const buffer = Buffer.from('%PDF-1.4\n%%EOF');
    await expect(extractResumeText({
      fileName: 'quebrado.pdf',
      mimeType: 'application/pdf',
      size: buffer.length,
      buffer,
    })).rejects.toThrow(/corrompido ou incompleto/);

    const senha = Object.assign(new Error('No password given'), { name: 'PasswordException' });
    expect(mensagemFalhaExtracao(senha, 'pdf')).toMatch(/protegido por senha/);
  });
});
