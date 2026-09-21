import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { extractResumeText } from '@/lib/curriculum/extract-resume-text';

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
  });
});
