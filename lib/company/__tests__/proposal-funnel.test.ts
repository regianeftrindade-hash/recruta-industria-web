import { describe, expect, it } from "vitest";
import type { JobProposalDTO } from "@/lib/company/job-proposals-shared";
import {
  EMPTY_PROPOSAL_TRACKING,
  isArquivada,
  isEntrevista,
  isPropostaAtiva,
  mergeProposalFunnel,
  parseProposalFunnelPatch,
} from "@/lib/company/job-proposals-shared";

function proposta(over: Partial<JobProposalDTO> & Pick<JobProposalDTO, "status">): JobProposalDTO {
  return {
    id: "p1",
    profileId: "prof",
    companyUserId: "co",
    companyName: "Empresa",
    cargo: "Soldador",
    salario: "4000",
    turno: "COMERCIAL",
    cidade: "Campinas",
    beneficios: "",
    mensagem: "",
    respondedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    interview: null,
    tracking: { ...EMPTY_PROPOSAL_TRACKING },
    ...over,
  };
}

describe("mergeProposalFunnel", () => {
  it("contratado desliga não contratado", () => {
    const next = mergeProposalFunnel(
      { ...EMPTY_PROPOSAL_TRACKING, naoContratado: true },
      { contratado: true },
    );
    expect(next.contratado).toBe(true);
    expect(next.naoContratado).toBe(false);
  });

  it("não contratado desliga contratado", () => {
    const next = mergeProposalFunnel(
      { ...EMPTY_PROPOSAL_TRACKING, contratado: true },
      { naoContratado: true },
    );
    expect(next.naoContratado).toBe(true);
    expect(next.contratado).toBe(false);
  });

  it("não mistura patch vazio com o atual", () => {
    const atual = { ...EMPTY_PROPOSAL_TRACKING, emTeste: true };
    expect(mergeProposalFunnel(atual, {})).toEqual(atual);
  });
});

describe("listas por proposta (não por perfil)", () => {
  it("proposta SENT não arquiva mesmo se outra vaga do perfil estiver contratada", () => {
    const p = proposta({
      status: "SENT",
      tracking: { ...EMPTY_PROPOSAL_TRACKING, contratado: true },
    });
    expect(isArquivada(p)).toBe(false);
    expect(isPropostaAtiva(p)).toBe(true);
  });

  it("entrevista confirmada fica em entrevistas se o funil desta proposta estiver limpo", () => {
    const p = proposta({
      status: "INTERVIEW_CONFIRMED",
      interview: {
        id: "i1",
        scheduledAt: "2026-09-10T12:00:00.000Z",
        locationType: "PLATFORM",
        address: null,
        meetingUrl: null,
        observacoes: "",
        status: "CONFIRMED",
      },
      tracking: { ...EMPTY_PROPOSAL_TRACKING },
    });
    expect(isEntrevista(p)).toBe(true);
    expect(isArquivada(p)).toBe(false);
    expect(isPropostaAtiva(p)).toBe(false);
  });

  it("contratado nesta proposta arquiva só ela", () => {
    const p = proposta({
      status: "INTERVIEW_CONFIRMED",
      interview: {
        id: "i1",
        scheduledAt: "2026-09-10T12:00:00.000Z",
        locationType: "PLATFORM",
        address: null,
        meetingUrl: null,
        observacoes: "",
        status: "CONFIRMED",
      },
      tracking: { ...EMPTY_PROPOSAL_TRACKING, contratado: true },
    });
    expect(isArquivada(p)).toBe(true);
    expect(isEntrevista(p)).toBe(false);
  });
});

describe("parseProposalFunnelPatch (API /funnel)", () => {
  it("ignora corpo vazio e strings", () => {
    expect(parseProposalFunnelPatch(null)).toEqual({});
    expect(parseProposalFunnelPatch({ contratado: "sim" })).toEqual({});
  });

  it("aceita só booleanos do funil", () => {
    expect(parseProposalFunnelPatch({ emTeste: true, lixo: 1 })).toEqual({ emTeste: true });
  });
});
