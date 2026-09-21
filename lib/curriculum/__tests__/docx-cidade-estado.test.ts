import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractResumeText } from '@/lib/curriculum/extract-resume-text';
import { buildResumeFormApplyPatch } from '@/lib/curriculum/apply-resume-to-form';

describe('DOCX cidade/estado end-to-end', () => {
  it('extrai e monta patch com Cascavel/PR', async () => {
    const buffer = readFileSync(
      join(__dirname, 'fixtures', 'cv-cidade-estado.docx'),
    );
    const result = await extractResumeText({
      fileName: 'cv-cidade-estado.docx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: buffer.length,
      buffer,
    });

    expect(result.rawText).toMatch(/Cascavel/i);
    expect(result.structured?.cidade).toMatch(/Cascavel/i);
    expect(result.structured?.estado).toBe('PR');

    const patch = buildResumeFormApplyPatch(
      result.structured,
      { formData: {}, telefone: '', telefone2: '' },
      { overwrite: true },
    );
    expect(patch.formDataPatch.estado).toBe('PR');
    expect(patch.cidadePendente).toMatch(/Cascavel/i);
    expect(patch.filledLabels).toEqual(
      expect.arrayContaining(['Estado', 'Cidade']),
    );
  });
});
