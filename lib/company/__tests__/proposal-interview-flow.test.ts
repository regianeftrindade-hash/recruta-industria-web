import { describe, expect, it } from "vitest";
import {
  assertInterviewRespondRules,
  assertInterviewScheduleRules,
  formatInterviewComprovante,
  isArquivada,
  isEntrevista,
  isPropostaAtiva,
  type JobProposalDTO,
  EMPTY_PROPOSAL_TRACKING,
} from "@/lib/company/job-proposals-shared";

function proposta(over: Partial<JobProposalDTO> & Pick<JobProposalDTO, "status">): JobProposalDTO {
  return {
    id: "p1",
    profileId: "prof",
    companyUserId: "co",
    companyName: "Metalúrgica X",
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

describe("fluxo proposta → entrevista", () => {
  it("SENT ativa; INTERESTED agenda; INTERVIEW_PENDING é entrevista", () => {
    expect(isPropostaAtiva(proposta({ status: "SENT" }))).toBe(true);
    expect(
      isEntrevista(
        proposta({
          status: "INTERVIEW_PENDING",
          interview: {
            id: "i1",
            scheduledAt: "2026-09-15T14:00:00.000Z",
            locationType: "ONLINE",
            address: null,
            meetingUrl: "https://meet.example.com/x",
            observacoes: "",
            status: "PENDING",
          },
        }),
      ),
    ).toBe(true);
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERESTED",
        locationType: "ONLINE",
        meetingUrl: "https://meet.example.com/x",
      }),
    ).not.toThrow();
  });

  it("arquiva só com funil da própria proposta", () => {
    const arquivada = proposta({
      status: "INTERVIEW_CONFIRMED",
      tracking: { ...EMPTY_PROPOSAL_TRACKING, contratado: true },
    });
    expect(isArquivada(arquivada)).toBe(true);
    expect(isPropostaAtiva(arquivada)).toBe(false);
  });

  it("profissional só responde entrevista PENDING", () => {
    expect(() => assertInterviewRespondRules("PENDING")).not.toThrow();
    expect(() => assertInterviewRespondRules("DECLINED")).toThrow("INTERVIEW_NOT_PENDING");
  });

  it("comprovante ONLINE inclui link", () => {
    const c = formatInterviewComprovante({
      companyName: "Metalúrgica X",
      scheduledAt: "2026-09-15T14:00:00.000Z",
      locationType: "ONLINE",
      address: null,
      meetingUrl: "https://meet.example.com/sala",
      observacoes: "Trazer EPI",
    });
    expect(c.localLabel).toContain("meet.example.com");
    expect(c.text).toContain("Trazer EPI");
    expect(c.html).toContain("Metalúrgica X");
  });
});
