import { describe, expect, it } from "vitest";
import { matchPublicJob, rankCompatibleJobs } from "@/lib/jobs/job-match";
import type { PublicJob } from "@/lib/jobs/job-posting";

function job(patch: Partial<PublicJob>): PublicJob {
  return {
    id: "job-1",
    anonymous: false,
    companyLabel: "Empresa",
    publicationDate: null,
    title: "Operador de produção",
    salaryLabel: null,
    contractLabel: "CLT",
    workModeLabel: "Presencial",
    workplace: "Joinville/SC",
    description: "Linha de montagem e solda MIG.",
    observations: null,
    applicationInstructions: null,
    applicationMode: "INTERNAL",
    externalApplyUrl: null,
    origin: "ADMIN",
    ...patch,
  };
}

const profile = {
  cargos: ["Operador de produção"],
  habilidades: ["Solda MIG"],
  cidade: "Joinville",
  estado: "SC",
};

describe("vagas compatíveis", () => {
  it("explica a correspondência só quando os dados batem", () => {
    const match = matchPublicJob(profile, job({}));
    expect(match?.reasons).toEqual([
      "Cargo compatível",
      "Habilidades relacionadas",
      "Na sua região",
    ]);
    expect(matchPublicJob(profile, job({
      title: "Analista financeiro",
      description: "Contas a pagar.",
      workplace: "Recife/PE",
    }))).toBeNull();
  });

  it("não marca região nem habilidade sem dado correspondente", () => {
    const match = matchPublicJob(
      { cargos: ["Soldador"], habilidades: [], cidade: "", estado: "" },
      job({ title: "Soldador", description: "Processo de soldagem.", workplace: null }),
    );
    expect(match?.reasons).toEqual(["Cargo compatível"]);
  });

  it("não inclui vaga sem correspondência", () => {
    const ranked = rankCompatibleJobs(profile, [
      job({ id: "fraca", title: "Auxiliar administrativo", description: "Escritório.", workplace: "Curitiba/PR" }),
      job({ id: "forte", title: "Operador de produção", workplace: "Joinville/SC" }),
    ]);
    expect(ranked.map((item) => item.id)).toEqual(["forte"]);
  });

  it("ordena as correspondências da publicação mais nova para a mais antiga", () => {
    const ranked = rankCompatibleJobs(profile, [
      job({
        id: "antiga",
        publicationDate: "01/09/2026",
        title: "Operador de produção soldador",
        description: "Solda MIG na linha.",
        workplace: "Joinville/SC",
      }),
      job({
        id: "nova",
        publicationDate: "23/10/2026",
        title: "Operador de produção",
        workplace: "Recife/PE",
      }),
    ]);
    expect(ranked.map((item) => item.id)).toEqual(["nova", "antiga"]);
  });
});
