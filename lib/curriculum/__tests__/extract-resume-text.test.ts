import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { extractResumeText, mensagemFalhaExtracao } from '@/lib/curriculum/extract-resume-text';
import { renderResumePdf, sanitizeResumeDraft } from '@/lib/curriculum/resume-draft';

function pdfSemTexto(): Buffer {
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Contents 4 0 R >> endobj\n',
    '4 0 obj << /Length 8 >> stream\n0 0 0 RG\nendstream\n',
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(body.length);
    body += objects[index];
  }
  const startxref = body.length;
  body += `xref\n0 5\n0000000000 65535 f \n`;
  for (let id = 1; id <= 4; id += 1) {
    body += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer << /Size 5 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;
  return Buffer.from(body, 'latin1');
}

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

  it('recusa PDF sem texto selecionável', async () => {
    const buffer = pdfSemTexto();
    await expect(extractResumeText({
      fileName: 'escaneado.pdf',
      mimeType: 'application/pdf',
      size: buffer.length,
      buffer,
    })).rejects.toThrow(/não tem texto selecionável/);
  });

  it('lê o PDF gerado pelo próprio site e devolve cargo, empresa e formação', async () => {
    const bytes = renderResumePdf(sanitizeResumeDraft({
      nome: 'Ana Paula Ferreira',
      cidade: 'Curitiba',
      estado: 'PR',
      telefone: '(41) 98888-7766',
      email: 'ana.ferreira@email.com',
      escolaridade: 'Médio completo',
      curso: 'Técnico em Soldagem',
      instituicao: 'SENAI',
      ano: '2016',
      experiencias: [
        {
          empresa: 'Metalúrgica ABC Ltda',
          cargo: 'Soldadora',
          inicio: '01/2018',
          fim: '',
          atividades: 'Solda MIG em estruturas metálicas.',
          segmento: 'Metalurgia',
        },
      ],
      cursos: ['NR-35'],
      cnh: 'B',
    }), 'classico');
    const buffer = Buffer.from(bytes);
    const result = await extractResumeText({
      fileName: 'curriculo.pdf',
      mimeType: 'application/pdf',
      size: buffer.length,
      buffer,
    });
    expect(result.rawText).toMatch(/Ana Paula Ferreira/);
    expect(result.structured.escolaridade).toBe('Médio completo');
    expect(result.structured.cursoFormacao).toMatch(/Técnico em Soldagem/);
    expect(result.structured.instituicaoFormacao).toBe('SENAI');
    expect(result.structured.experiencias?.[0]?.cargo).toBe('Soldadora');
    expect(result.structured.experiencias?.[0]?.empresa).toMatch(/Metalúrgica ABC/);
    expect(result.structured.cursos || []).toContain('NR-35');
  });
});
