import { describe, expect, it } from "vitest";
import {
  comparePublicationDateDesc,
  jobApplicationDeadline,
  publicJobCopy,
  statedJobFact,
  textWithoutJobSource,
} from "@/lib/jobs/public-job-display";

describe("textWithoutJobSource", () => {
  it("remove a fonte e a atribuição do anúncio", () => {
    const text = textWithoutJobSource(
      "Anúncio público do Emprega Campinas, código 3593163, publicado em 21/09/2026. Candidaturas abertas até 30/10/2026, conforme o anúncio. Fonte: https://empregacampinas.com.br/ferramenteiro-jr/",
    );
    expect(text).toBeNull();
  });

  it("mantém uma observação escrita pela empresa", () => {
    expect(textWithoutJobSource("Levar RG e CPF no dia da entrevista.")).toBe(
      "Levar RG e CPF no dia da entrevista.",
    );
  });
});

describe("publicJobCopy", () => {
  it("troca o rótulo longo do salário e tira contratação não informada", () => {
    expect(publicJobCopy(
      "Prepara materiais.\nSalário informado no anúncio: R$ 2.398,00\nTipo de contratação não informado\nQuantidade de vagas no anúncio: 3.",
    )).toBe(
      "Prepara materiais.\nSalário: R$ 2.398,00",
    );
  });

  it("não publica um fato vazio", () => {
    expect(statedJobFact("Não informado no anúncio")).toBeNull();
    expect(statedJobFact("CLT")).toBe("CLT");
    expect(statedJobFact("Valinhos - SP")).toBe("Valinhos - SP");
  });
});

describe("jobApplicationDeadline", () => {
  it("lê o prazo das instruções", () => {
    expect(jobApplicationDeadline({
      applicationInstructions: "Colocar a sigla FERRAMENTEIRO no assunto. Prazo informado no anúncio: até 30/10/2026.",
    })).toBe("30/10/2026");
  });

  it("ordena da publicação mais nova para a mais antiga", () => {
    const dates = ["01/09/2026", null, "23/10/2026", "23/10/2026", "18/09/2026"];
    expect([...dates].sort(comparePublicationDateDesc)).toEqual([
      "23/10/2026",
      "23/10/2026",
      "18/09/2026",
      "01/09/2026",
      null,
    ]);
  });

  it("lê o prazo das observações quando as instruções não têm data", () => {
    expect(jobApplicationDeadline({
      observations: "Candidaturas abertas até 23/10/2026, conforme o anúncio.",
    })).toBe("23/10/2026");
  });
});
