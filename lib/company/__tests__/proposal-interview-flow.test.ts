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

  it("agenda ONLINE sem URL falha; PRESENCIAL sem endereço falha", () => {
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERESTED",
        locationType: "ONLINE",
        meetingUrl: "",
      }),
    ).toThrow("MEETING_URL_REQUIRED");
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERESTED",
        locationType: "PRESENTIAL",
        address: "",
      }),
    ).toThrow("ADDRESS_REQUIRED");
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "SENT",
        locationType: "PLATFORM",
      }),
    ).toThrow("PROPOSAL_NOT_SCHEDULABLE");
  });

  it("comprovante presencial usa endereço", () => {
    const c = formatInterviewComprovante({
      companyName: "Metalúrgica X",
      scheduledAt: "2026-09-15T14:00:00.000Z",
      locationType: "PRESENTIAL",
      address: "Av. Industrial, 100",
      meetingUrl: null,
      observacoes: "",
    });
    expect(c.localLabel).toContain("Av. Industrial");
  });

  it("assertInterviewScheduleRules: PLATFORM ok; whitespace em URL/endereço falha; status inválidos", () => {
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERESTED",
        locationType: "PLATFORM",
      }),
    ).not.toThrow();
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERVIEW_PENDING",
        locationType: "PLATFORM",
      }),
    ).not.toThrow();
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERVIEW_CONFIRMED",
        locationType: "ONLINE",
        meetingUrl: "https://teams.microsoft.com/l/meetup",
      }),
    ).not.toThrow();
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERVIEW_CANCELLED",
        locationType: "PRESENTIAL",
        address: "Rua A, 1",
      }),
    ).not.toThrow();

    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERESTED",
        locationType: "ONLINE",
        meetingUrl: "   ",
      }),
    ).toThrow("MEETING_URL_REQUIRED");
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERESTED",
        locationType: "PRESENTIAL",
        address: "\t  ",
      }),
    ).toThrow("ADDRESS_REQUIRED");
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERESTED",
        locationType: "HYBRID",
      }),
    ).toThrow("INVALID_LOCATION_TYPE");
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "MORE_INFO",
        locationType: "PLATFORM",
      }),
    ).toThrow("PROPOSAL_NOT_SCHEDULABLE");
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "DECLINED",
        locationType: "PLATFORM",
      }),
    ).toThrow("PROPOSAL_NOT_SCHEDULABLE");
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERVIEW_DECLINED",
        locationType: "PLATFORM",
      }),
    ).toThrow("PROPOSAL_NOT_SCHEDULABLE");
  });

  it("transições de lista: MORE_INFO ativa; DECLINED arquiva; cancelada arquiva", () => {
    expect(isPropostaAtiva(proposta({ status: "MORE_INFO" }))).toBe(true);
    expect(isEntrevista(proposta({ status: "MORE_INFO" }))).toBe(false);

    expect(isArquivada(proposta({ status: "DECLINED" }))).toBe(true);
    expect(isPropostaAtiva(proposta({ status: "DECLINED" }))).toBe(false);

    const cancelada = proposta({
      status: "INTERVIEW_CANCELLED",
      interview: {
        id: "i1",
        scheduledAt: "2026-09-15T14:00:00.000Z",
        locationType: "PLATFORM",
        address: null,
        meetingUrl: null,
        observacoes: "",
        status: "CANCELLED",
      },
    });
    expect(isArquivada(cancelada)).toBe(true);
    expect(isEntrevista(cancelada)).toBe(false);

    const recusada = proposta({
      status: "INTERVIEW_DECLINED",
      interview: {
        id: "i2",
        scheduledAt: "2026-09-15T14:00:00.000Z",
        locationType: "ONLINE",
        address: null,
        meetingUrl: "https://meet.example.com/x",
        observacoes: "",
        status: "DECLINED",
      },
    });
    expect(isArquivada(recusada)).toBe(true);
    expect(isEntrevista(recusada)).toBe(false);
  });

  it("profissional não responde entrevista já confirmada ou cancelada", () => {
    expect(() => assertInterviewRespondRules("CONFIRMED")).toThrow("INTERVIEW_NOT_PENDING");
    expect(() => assertInterviewRespondRules("CANCELLED")).toThrow("INTERVIEW_NOT_PENDING");
  });

  it("INTERVIEW_PENDING sem interview não entra em entrevistas; INTERESTED ignora flags de funil", () => {
    const pendenteSemInterview = proposta({ status: "INTERVIEW_PENDING", interview: null });
    expect(isEntrevista(pendenteSemInterview)).toBe(false);
    expect(isArquivada(pendenteSemInterview)).toBe(false);
    expect(isPropostaAtiva(pendenteSemInterview)).toBe(false);

    const interessada = proposta({
      status: "INTERESTED",
      tracking: {
        ...EMPTY_PROPOSAL_TRACKING,
        contratado: true,
        naoContratado: true,
        entrevistaCancelada: true,
      },
    });
    expect(isArquivada(interessada)).toBe(false);
    expect(isPropostaAtiva(interessada)).toBe(true);
    expect(isEntrevista(interessada)).toBe(false);
  });

  it("arquiva por interview CANCELLED, naoContratado ou entrevistaCancelada; tracking ausente não quebra", () => {
    const canceladaNoInterview = proposta({
      status: "INTERVIEW_CONFIRMED",
      interview: {
        id: "i1",
        scheduledAt: "2026-09-15T14:00:00.000Z",
        locationType: "PLATFORM",
        address: null,
        meetingUrl: null,
        observacoes: "",
        status: "CANCELLED",
      },
    });
    expect(isArquivada(canceladaNoInterview)).toBe(true);
    expect(isEntrevista(canceladaNoInterview)).toBe(false);

    expect(
      isArquivada(
        proposta({
          status: "INTERVIEW_CONFIRMED",
          interview: {
            id: "i2",
            scheduledAt: "2026-09-15T14:00:00.000Z",
            locationType: "PLATFORM",
            address: null,
            meetingUrl: null,
            observacoes: "",
            status: "CONFIRMED",
          },
          tracking: { ...EMPTY_PROPOSAL_TRACKING, naoContratado: true },
        }),
      ),
    ).toBe(true);

    expect(
      isArquivada(
        proposta({
          status: "INTERVIEW_PENDING",
          interview: {
            id: "i3",
            scheduledAt: "2026-09-15T14:00:00.000Z",
            locationType: "ONLINE",
            address: null,
            meetingUrl: "https://meet.example.com/x",
            observacoes: "",
            status: "PENDING",
          },
          tracking: { ...EMPTY_PROPOSAL_TRACKING, entrevistaCancelada: true },
        }),
      ),
    ).toBe(true);

    const semTracking = {
      ...proposta({ status: "INTERVIEW_CONFIRMED" }),
      tracking: undefined,
    } as unknown as JobProposalDTO;
    expect(isArquivada(semTracking)).toBe(false);
  });

  it("reagendamento: trim em URL/endereço ok; locationType vazio; ONLINE/PRESENTIAL sem campo falha", () => {
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERVIEW_CANCELLED",
        locationType: "ONLINE",
        meetingUrl: "  https://meet.example.com/sala  ",
      }),
    ).not.toThrow();
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERVIEW_PENDING",
        locationType: "PRESENTIAL",
        address: "  Rua B, 2  ",
      }),
    ).not.toThrow();
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERESTED",
        locationType: "PLATFORM",
        meetingUrl: undefined,
        address: undefined,
      }),
    ).not.toThrow();
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERESTED",
        locationType: "",
      }),
    ).toThrow("INVALID_LOCATION_TYPE");
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERESTED",
        locationType: "ONLINE",
      }),
    ).toThrow("MEETING_URL_REQUIRED");
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERESTED",
        locationType: "PRESENTIAL",
      }),
    ).toThrow("ADDRESS_REQUIRED");
  });

  it("comprovante: PLATFORM, fallbacks, escape HTML, Date e obs vazia", () => {
    const platform = formatInterviewComprovante({
      companyName: "Metalúrgica X",
      scheduledAt: new Date("2026-09-15T14:00:00.000Z"),
      locationType: "PLATFORM",
      address: null,
      meetingUrl: null,
      observacoes: "   ",
    });
    expect(platform.localLabel).toMatch(/plataforma/i);
    expect(platform.text).not.toContain("Observações:");
    expect(platform.html).not.toContain("Observações:");

    const onlineSemLink = formatInterviewComprovante({
      companyName: "A & B <Corp>",
      scheduledAt: "2026-09-15T14:00:00.000Z",
      locationType: "ONLINE",
      meetingUrl: "  ",
      observacoes: 'Cuidado com "aspas"',
    });
    expect(onlineSemLink.localLabel).toContain("link a confirmar");
    expect(onlineSemLink.html).toContain("A &amp; B &lt;Corp&gt;");
    expect(onlineSemLink.html).toContain("&quot;aspas&quot;");
    expect(onlineSemLink.text).toContain("Observações:");

    const presencialSemEndereco = formatInterviewComprovante({
      companyName: "Metalúrgica X",
      scheduledAt: "2026-09-15T14:00:00.000Z",
      locationType: "PRESENTIAL",
      address: null,
      observacoes: "",
    });
    expect(presencialSemEndereco.localLabel).toContain("endereço a confirmar");
  });
});
