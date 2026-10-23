import { describe, expect, it } from "vitest";
import { PREMIUM_HIRE_NOTICE, PREMIUM_RESUME_PROMPT } from "@/lib/curriculum/resume-copy";
import { renderResumePdf, resumeBlocks, sanitizeResumeDraft } from "@/lib/curriculum/resume-draft";
import { draftFromProfile } from "@/lib/curriculum/resume-from-profile";

describe("gerador de currículo", () => {
  it("omite seções vazias e não inventa experiência", () => {
    const blocks = resumeBlocks(sanitizeResumeDraft({
      nome: "Ana Souza",
      cidade: "Joinville",
      estado: "SC",
      objetivo: "Operadora de produção",
    }));
    const titles = blocks.blocks.map((block) => block.title);
    expect(blocks.heading[0]).toBe("Ana Souza");
    expect(titles).toContain("Objetivo");
    expect(titles).not.toContain("Experiência profissional");
    expect(titles).not.toContain("Idiomas");
    expect(JSON.stringify(blocks)).not.toMatch(/empresa fictícia|lorem|exemplo de cargo/i);
  });

  it("lê só os dados reais do perfil e deixa de fora CPF, religião e antecedentes", () => {
    const draft = draftFromProfile({
      name: "Ana Souza",
      email: "ana@example.invalid",
      profile: {
        cidade: "Joinville",
        estado: "SC",
        phone: "47999998888",
        email: "ana@example.invalid",
        cargoDesejado: "Soldadora",
        mensagemEmpresas: "Atuo em linha de produção.",
        escolaridade: "Técnico",
        experienciasJSON: JSON.stringify([
          { nome: "Metalúrgica Sul", cargo: "Soldadora", dataInicio: "2020", dataFim: "2024", descricao: "Solda MIG" },
        ]),
        cursosCertificacoes: JSON.stringify(["NR-12"]),
        skills: JSON.stringify(["Solda MIG", "Inglês"]),
        formDataJSON: JSON.stringify({
          cpf: "123.456.789-00",
          religiao: "Católica",
          antecedentes: "Não",
          possuiCNH: "Sim",
          categoriaCNH: "B",
          idiomas: ["Inglês"],
          cursoFormacao: "Técnico em mecânica",
          instituicaoFormacao: "SENAI",
        }),
      },
    });

    expect(draft.nome).toBe("Ana Souza");
    expect(draft.experiencias[0]?.empresa).toBe("Metalúrgica Sul");
    expect(draft.cnh).toBe("B");
    expect(draft.idiomas).toEqual(["Inglês"]);
    expect(draft.habilidades).toEqual(["Solda MIG"]);
    expect(JSON.stringify(draft)).not.toContain("123.456.789-00");
    expect(JSON.stringify(draft)).not.toContain("Católica");
    expect(JSON.stringify(draft)).not.toContain("antecedentes");
  });

  it("gera um PDF de texto, com acento, e abre outra página quando o conteúdo passa de uma", () => {
    const curto = renderResumePdf(sanitizeResumeDraft({
      nome: "Ana Souza",
      cidade: "São Paulo",
      estado: "SP",
      resumo: "Produção industrial.",
      experiencias: [{ empresa: "A (B)", cargo: "Operadora", inicio: "2021", fim: "", atividades: "Linha", segmento: "" }],
    }));
    const texto = Buffer.from(curto).toString("latin1");
    expect(texto.startsWith("%PDF-1.4")).toBe(true);
    expect(texto).toContain("Ana Souza");
    expect(texto).toContain("São Paulo");
    expect(texto).toContain("Produção industrial.");
    expect(texto).toContain("A \\(B\\)");
    expect(texto).not.toContain("Experiência fictícia");

    const longo = renderResumePdf(sanitizeResumeDraft({
      nome: "Ana Souza",
      experiencias: Array.from({ length: 12 }, (_, index) => ({
        empresa: `Empresa ${index + 1}`,
        cargo: "Operadora de produção",
        inicio: "2010",
        fim: "2020",
        atividades: "Atividade detalhada na linha industrial. ".repeat(30),
        segmento: "Metalurgia",
      })),
    }));
    expect(Buffer.from(longo).toString("latin1")).toMatch(/\/Count [2-9]/);
  });

  it("descarta e-mail inválido e não guarda o caminho de outro profissional", () => {
    const draft = sanitizeResumeDraft({
      nome: "Ana",
      email: "nao-e-email",
      experiencias: [{ empresa: "", cargo: "", atividades: "" }],
    });
    expect(draft.email).toBe("");
    expect(draft.experiencias).toEqual([]);
  });

  it("mantém o texto do aviso de contratação e o pedido de currículo do Premium", () => {
    expect(PREMIUM_RESUME_PROMPT).toBe(
      "Para utilizar a candidatura Premium, você precisa ter um currículo salvo no seu perfil.",
    );
    expect(PREMIUM_HIRE_NOTICE).toHaveLength(4);
    expect(PREMIUM_HIRE_NOTICE[0]).toMatch(/Mantenha seu currículo disponível/);
    expect(PREMIUM_HIRE_NOTICE.join(" ")).toMatch(/continuar|depois/i);
  });
});
