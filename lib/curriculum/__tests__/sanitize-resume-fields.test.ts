import { describe, expect, it } from "vitest";
import { sanitizeResumeProfileFields } from "@/lib/curriculum/sanitize-resume-fields";

describe("sanitizeResumeProfileFields", () => {
  it("reorganiza o que o PDF gravou nos campos errados", () => {
    const limpo = sanitizeResumeProfileFields({
      nome: "Re Trindade",
      cursoFormacao: "(cursando)",
      instituicaoFormacao: "Metropolitana",
      cursos: [
        "UF: BRA",
        "➢ Curso Auxiliar Administrativo — Faculdade Metropolitana",
        "Rotinas administrativas, fiscais e de Departamento Pessoal",
        "Emissão e controle de documentos fiscais eletrônicos (NF-e, NFC-e, NFS-e)",
      ],
      certificacoes: ["Regiane Fernandes Trindade Macedo"],
      maquinasEquipamentos: ["CNC", "Injetora", "CEP", "Excel Básico"],
      qualidadeProcessos: [],
      informatica: [],
    });

    expect(limpo.cursoFormacao).toBe("Auxiliar Administrativo (cursando)");
    expect(limpo.instituicaoFormacao).toBe("Faculdade Metropolitana");
    expect(limpo.cursos).toEqual([]);
    expect(limpo.conteudoFormacao).toMatch(/Rotinas administrativas/);
    expect(limpo.certificacoes).toEqual([]);
    expect(limpo.maquinasEquipamentos).toEqual(["CNC", "Injetora"]);
    expect(limpo.qualidadeProcessos).toEqual(["CEP"]);
    expect(limpo.informatica).toEqual(["Excel Básico"]);
  });

  it("mantém cursos reais de outro currículo", () => {
    const limpo = sanitizeResumeProfileFields({
      nome: "Ideraldo Sousa",
      cursoFormacao: "",
      instituicaoFormacao: "",
      cursos: ["BOVINOS (SUPRA) COM RICARDO BARBOSA- GER. BOVINOS", "NR-12"],
      certificacoes: [],
      maquinasEquipamentos: ["Empilhadeira"],
      qualidadeProcessos: ["5S"],
      informatica: [],
    });

    expect(limpo.cursos).toEqual([
      "BOVINOS (SUPRA) COM RICARDO BARBOSA- GER. BOVINOS",
      "NR-12",
    ]);
    expect(limpo.maquinasEquipamentos).toEqual(["Empilhadeira"]);
    expect(limpo.qualidadeProcessos).toEqual(["5S"]);
    expect(limpo.cursoFormacao).toBe("");
  });
});
