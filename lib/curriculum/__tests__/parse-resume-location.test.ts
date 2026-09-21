import { describe, expect, it } from 'vitest';
import { parseResumePatterns } from '@/lib/curriculum/parse-resume-patterns';

describe('parseResumePatterns localização realista', () => {
  const cases: Array<{ name: string; text: string; cidade: RegExp; estado: string }> = [
    {
      name: 'rótulos colados tipo tabela Word',
      text: 'João Silva\nCidade: CuritibaEstado: PR\nTelefone: (41) 99999-0000',
      cidade: /Curitiba/i,
      estado: 'PR',
    },
    {
      name: 'rótulos na mesma linha',
      text: 'Ana Souza\nCidade: Londrina Estado: Paraná E-mail: ana@x.com',
      cidade: /Londrina/i,
      estado: 'PR',
    },
    {
      name: 'endereço com CEP',
      text: 'Pedro\nEndereço: Rua A, 10 - Centro - São José dos Pinhais/PR - CEP 83010-000',
      cidade: /S[aã]o Jos[eé] dos Pinhais/i,
      estado: 'PR',
    },
    {
      name: 'UF antes da cidade',
      text: 'Carla\nPR - Maringá\n',
      cidade: /Maring/i,
      estado: 'PR',
    },
    {
      name: 'naturalidade',
      text: 'Bruno\nNaturalidade: Belo Horizonte/MG\n',
      cidade: /Belo Horizonte/i,
      estado: 'MG',
    },
  ];

  for (const c of cases) {
    it(c.name, () => {
      const r = parseResumePatterns(c.text);
      expect(r.estado, `estado em: ${c.name}`).toBe(c.estado);
      expect(r.cidade || '', `cidade em: ${c.name}`).toMatch(c.cidade);
    });
  }
});
