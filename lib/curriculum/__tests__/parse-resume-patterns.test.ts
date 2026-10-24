import { describe, expect, it } from 'vitest';
import { parseResumePatterns, preprocessResumeText } from '@/lib/curriculum/parse-resume-patterns';
import { buildResumeFormApplyPatch, matchCidadeIbge } from '@/lib/curriculum/apply-resume-to-form';

const SAMPLE = `
João da Silva Santos
Data de nascimento: 15/03/1990
joao.silva@email.com
(41) 99999-8877
Curitiba - PR

CNH categoria B

Formação Acadêmica
Superior completo
Curso: Técnico em Mecânica
Instituição: SENAI
Conclusão: 2018

Experiência Profissional
Empresa: Metalúrgica Paraná
Cargo: Operador CNC
01/2020 - 12/2023
Operação de CNC Fanuc e torno convencional.

Cursos e Certificações
NR-12
NR-35
Excel Avançado
ISO 9001

Competências
CNC Siemens, Empilhadeira, 5S, SAP
`;

const MESSY = `
Maria Souza E-mail: maria.souza@empresa.com.br Telefone: 11987654321 Endereço: São Paulo/SP
Nascimento: 22/08/1995 WhatsApp (11) 98888-7777 Escolaridade Ensino Médio completo CNH B
Experiência Profissional Empresa: Autopeças Brasil Cargo: Auxiliar de produção 03/2019 - Atual
`;

describe('parseResumePatterns', () => {
  it('extrai nome, contato, cidade, CNH, formação e competências', () => {
    const r = parseResumePatterns(SAMPLE);
    expect(r.nome).toMatch(/João/i);
    expect(r.dataNascimentoDisplay).toBe('15/03/1990');
    expect(r.dataNascimento).toBe('1990-03-15');
    expect(r.contato?.email).toBe('joao.silva@email.com');
    expect(r.contato?.telefone).toContain('41');
    expect(r.cidade).toMatch(/Curitiba/i);
    expect(r.estado).toBe('PR');
    expect(r.cnh).toBe('B');
    expect(r.escolaridade).toBe('Superior completo');
    expect(r.cursoFormacao).toMatch(/Mecânica/i);
    expect(r.instituicaoFormacao).toMatch(/SENAI/i);
    expect(r.anoConclusaoFormacao).toBe('2018');
    expect(r.experiencias?.length).toBeGreaterThan(0);
    expect(r.maquinasEquipamentos?.length).toBeGreaterThan(0);
    expect(r.matchedFields?.length).toBeGreaterThan(5);
  });

  it('extrai dados mesmo com texto colado (comum em PDF)', () => {
    const r = parseResumePatterns(MESSY);
    expect(r.contato?.email).toBe('maria.souza@empresa.com.br');
    expect(r.contato?.telefone).toContain('11');
    expect(r.cidade).toMatch(/São Paulo|Sao Paulo/i);
    expect(r.estado).toBe('SP');
    expect(r.dataNascimentoDisplay).toBe('22/08/1995');
    expect(r.escolaridade).toBe('Médio completo');
    expect(r.cnh).toBe('B');
  });

  it('extrai idade, cidade e estado mesmo sem data numérica', () => {
    const r = parseResumePatterns(`
João da Silva
Idade: 34 anos
Cidade: Londrina
Estado: Paraná
`);
    expect(r.nome).toMatch(/João/i);
    expect(r.idade).toBe('34');
    expect(r.cidade).toMatch(/Londrina/i);
    expect(r.estado).toBe('PR');
  });

  it('lê empresa e cargo mesmo sem o título Experiência', () => {
    const r = parseResumePatterns(`
João da Silva Santos
joao.silva@email.com
(41) 99999-8877
Empresa: Metalúrgica Paraná
Cargo: Operador CNC
01/2020 - 12/2023
`);
    expect(r.nome).toMatch(/João/i);
    expect(r.experiencias?.[0]?.empresa).toMatch(/Metalúrgica/i);
    expect(r.experiencias?.[0]?.cargo).toMatch(/Operador/i);
    expect(r.experiencias?.[0]?.dataInicio).toBe('2020-01');
  });

  it('separa período, empresa e cargo quando a data vem primeiro', () => {
    const r = parseResumePatterns(`
Maria Souza
maria.souza@empresa.com.br
Experiência Profissional
2015 - 2020 | Empresa ABC Ltda | Auxiliar de produção
`);
    expect(r.experiencias?.[0]?.empresa).toMatch(/ABC/i);
    expect(r.experiencias?.[0]?.cargo).toMatch(/Auxiliar/i);
    expect(r.experiencias?.[0]?.dataInicio).toBe('2015-01');
  });

  it('não trata rótulo, ementa e nome como curso do PDF', () => {
    const r = parseResumePatterns(`
Regiane Fernandes Trindade Macedo
UF: BRA
Hortolândia - SP

Formação Acadêmica
Superior completo
Curso Auxiliar Administrativo — Faculdade Metropolitana (cursando)
2021

Cursos
➢ Curso Auxiliar Administrativo — Faculdade Metropolitana
Rotinas administrativas, fiscais e de Departamento Pessoal
Emissão e controle de documentos fiscais eletrônicos (NF-e, NFC-e, NFS-e)
Noções de processos administrativos, fluxogramas e melhoria de processos
Noções de legislação trabalhista, admissão, demissão e afastamentos
Controle de relatórios gerenciais e absenteísmo.

Competências
CNC, Injetora, CEP, Excel Básico
`);
    expect(r.cursoFormacao).toMatch(/Auxiliar Administrativo/i);
    expect(r.cursoFormacao).toMatch(/cursando/i);
    expect(r.instituicaoFormacao).toBe('Faculdade Metropolitana');
    expect(r.escolaridade).toBe('Superior completo');
    expect(r.cursos || []).not.toEqual(expect.arrayContaining([expect.stringMatching(/UF:\s*BRA/i)]));
    expect(r.cursos || []).not.toEqual(expect.arrayContaining([expect.stringMatching(/^Rotinas/i)]));
    expect(r.conteudoFormacao).toMatch(/Rotinas administrativas/i);
    expect(r.informatica).toContain('Excel Básico');
    expect(r.maquinasEquipamentos).not.toContain('Excel Básico');
    expect(r.qualidadeProcessos).toContain('CEP');
    expect(r.maquinasEquipamentos).not.toContain('CEP');
    expect(r.maquinasEquipamentos).toEqual(expect.arrayContaining(['CNC', 'Injetora']));
  });

  it('separa a UF colada no próximo título do PDF', () => {
    const r = parseResumePatterns('Joao da Silva Santos joao.silva@email.com Curitiba - PRSuperior completo');
    expect(r.nome).toMatch(/Joao/i);
    expect(r.estado).toBe('PR');
    expect(r.escolaridade).toBe('Superior completo');
  });

  it('entende cidade com estado por extenso e data por extenso', () => {
    const r = parseResumePatterns(`
Maria Souza
Curitiba - Paraná
15 de março de 1990
`);
    expect(r.cidade).toMatch(/Curitiba/i);
    expect(r.estado).toBe('PR');
    expect(r.dataNascimentoDisplay).toBe('15/03/1990');
    expect(r.idade).toBeTruthy();
  });
});

describe('buildResumeFormApplyPatch', () => {
  it('gera patch e marca cidade pendente', () => {
    const structured = parseResumePatterns(SAMPLE);
    const patch = buildResumeFormApplyPatch(
      structured,
      {
        formData: { nome: 'Já existe', email: '' },
        telefone: '',
        telefone2: '',
      },
      { overwrite: true },
    );
    expect(patch.formDataPatch.email).toBe('joao.silva@email.com');
    expect(patch.dataNascimentoDisplay).toBe('15/03/1990');
    expect(patch.formDataPatch.dataNascimento).toBe('1990-03-15');
    expect(patch.telefone).toBeTruthy();
    expect(patch.cidadePendente).toMatch(/Curitiba/i);
    expect(patch.empresas?.length).toBeGreaterThan(0);
  });
});

describe('matchCidadeIbge', () => {
  it('casa cidade ignorando acentos', () => {
    expect(matchCidadeIbge('Sao Paulo', ['São Paulo', 'Santos'])).toBe('São Paulo');
    expect(matchCidadeIbge('curitiba', ['Curitiba', 'Londrina'])).toBe('Curitiba');
  });
});
