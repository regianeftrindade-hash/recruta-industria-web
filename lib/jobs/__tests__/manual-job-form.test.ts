import { describe, expect, it } from "vitest";
import { JobPostingError } from "@/lib/jobs/job-posting";
import { dataDeHojeSaoPaulo, parseManualJobDraft } from "@/lib/jobs/manual-job-form";

const agora = new Date("2026-11-08T15:00:00.000Z");

function base(extra: Record<string, unknown> = {}) {
  return {
    title: "Auxiliar de Produção",
    companyName: "Indústria Norte",
    description: "Apoio na linha de produção.",
    careOf: "Maria",
    subject: "Produção",
    applicationEmail: "rh@industria.example",
    ...extra,
  };
}

describe("parseManualJobDraft", () => {
  it("publica hoje em São Paulo quando a data não vem preenchida", () => {
    const draft = parseManualJobDraft(base(), agora);
    expect(dataDeHojeSaoPaulo(agora)).toBe("2026-11-08");
    expect(draft.publicationDate.toISOString()).toBe("2026-11-08T00:00:00.000Z");
    expect(draft.applicationEmail).toBe("rh@industria.example");
    expect(draft.careOf).toBe("Maria");
    expect(draft.subject).toBe("Produção");
  });

  it("aceita só o WhatsApp e um prazo", () => {
    const draft = parseManualJobDraft(base({
      applicationEmail: "",
      applicationWhatsapp: "(11) 98888-7777",
      deadline: "2026-11-20",
      salary: "2.500,00",
    }), agora);
    expect(draft.applicationEmail).toBeNull();
    expect(draft.applicationWhatsapp).toMatch(/^55/);
    expect(draft.deadline).toBe("20/11/2026");
    expect(draft.salaryCents).toBe(250000);
  });

  it("pede um destino para o currículo", () => {
    expect(() => parseManualJobDraft(base({ applicationEmail: "", applicationWhatsapp: "" }), agora))
      .toThrow(JobPostingError);
  });
});
