import { describe, expect, it } from "vitest";
import { jobApplicationDeadline, textWithoutJobSource } from "@/lib/jobs/public-job-display";

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

describe("jobApplicationDeadline", () => {
  it("lê o prazo das instruções", () => {
    expect(jobApplicationDeadline({
      applicationInstructions: "Colocar a sigla FERRAMENTEIRO no assunto. Prazo informado no anúncio: até 30/10/2026.",
    })).toBe("30/10/2026");
  });

  it("lê o prazo das observações quando as instruções não têm data", () => {
    expect(jobApplicationDeadline({
      observations: "Candidaturas abertas até 23/10/2026, conforme o anúncio.",
    })).toBe("23/10/2026");
  });
});
