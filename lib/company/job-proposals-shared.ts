export type ProposalStatus =
  | "SENT"
  | "INTERESTED"
  | "MORE_INFO"
  | "DECLINED"
  | "INTERVIEW_PENDING"
  | "INTERVIEW_CONFIRMED"
  | "INTERVIEW_DECLINED"
  | "INTERVIEW_CANCELLED";

export type InterviewLocationType = "PRESENTIAL" | "ONLINE" | "PLATFORM";
export type InterviewStatus = "PENDING" | "CONFIRMED" | "DECLINED" | "CANCELLED";

const SCHEDULABLE_STATUSES: ProposalStatus[] = [
  "INTERESTED",
  "INTERVIEW_PENDING",
  "INTERVIEW_CONFIRMED",
  "INTERVIEW_CANCELLED",
];

/** Valida regras de agendamento sem tocar no banco. */
export function assertInterviewScheduleRules(input: {
  proposalStatus: ProposalStatus;
  locationType: string;
  meetingUrl?: string;
  address?: string;
}): void {
  if (!SCHEDULABLE_STATUSES.includes(input.proposalStatus)) {
    throw new Error("PROPOSAL_NOT_SCHEDULABLE");
  }
  if (input.locationType === "ONLINE" && !String(input.meetingUrl || "").trim()) {
    throw new Error("MEETING_URL_REQUIRED");
  }
  if (input.locationType === "PRESENTIAL" && !String(input.address || "").trim()) {
    throw new Error("ADDRESS_REQUIRED");
  }
  if (
    input.locationType !== "ONLINE"
    && input.locationType !== "PRESENTIAL"
    && input.locationType !== "PLATFORM"
  ) {
    throw new Error("INVALID_LOCATION_TYPE");
  }
}

/** Resposta do profissional à entrevista pendente. */
export function assertInterviewRespondRules(interviewStatus: InterviewStatus): void {
  if (interviewStatus !== "PENDING") {
    throw new Error("INTERVIEW_NOT_PENDING");
  }
}

export type JobInterviewDTO = {
  id: string;
  scheduledAt: string;
  locationType: InterviewLocationType;
  address: string | null;
  meetingUrl: string | null;
  observacoes: string;
  status: InterviewStatus;
};

export type ProposalFunnelTracking = {
  contatado: boolean;
  entrevistado: boolean;
  emTeste: boolean;
  contratado: boolean;
  naoContratado: boolean;
  entrevistaCancelada: boolean;
};

export const EMPTY_PROPOSAL_TRACKING: ProposalFunnelTracking = {
  contatado: false,
  entrevistado: false,
  emTeste: false,
  contratado: false,
  naoContratado: false,
  entrevistaCancelada: false,
};

export function mergeProposalFunnel(
  current: ProposalFunnelTracking,
  patch: Partial<ProposalFunnelTracking>,
): ProposalFunnelTracking {
  const next: ProposalFunnelTracking = {
    contatado: patch.contatado ?? current.contatado,
    entrevistado: patch.entrevistado ?? current.entrevistado,
    emTeste: patch.emTeste ?? current.emTeste,
    contratado: patch.contratado ?? current.contratado,
    naoContratado: patch.naoContratado ?? current.naoContratado,
    entrevistaCancelada: patch.entrevistaCancelada ?? current.entrevistaCancelada,
  };
  if (patch.contratado === true) next.naoContratado = false;
  if (patch.naoContratado === true) next.contratado = false;
  return next;
}

/** Corpo JSON do PATCH /funnel (empresa e profissional). */
export function parseProposalFunnelPatch(body: unknown): Partial<ProposalFunnelTracking> {
  const src = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const patch: Partial<ProposalFunnelTracking> = {};
  if (typeof src.entrevistado === "boolean") patch.entrevistado = src.entrevistado;
  if (typeof src.emTeste === "boolean") patch.emTeste = src.emTeste;
  if (typeof src.contratado === "boolean") patch.contratado = src.contratado;
  if (typeof src.naoContratado === "boolean") patch.naoContratado = src.naoContratado;
  if (typeof src.entrevistaCancelada === "boolean") patch.entrevistaCancelada = src.entrevistaCancelada;
  if (typeof src.contatado === "boolean") patch.contatado = src.contatado;
  return patch;
}

function trackingOf(p: JobProposalDTO): ProposalFunnelTracking {
  return p.tracking || { ...EMPTY_PROPOSAL_TRACKING };
}

/** Funil por proposta: uma vaga arquivada não arrasta outra do mesmo perfil. */
export function isArquivada(p: JobProposalDTO): boolean {
  if (p.status === "SENT" || p.status === "MORE_INFO" || p.status === "INTERESTED") {
    return false;
  }
  const t = trackingOf(p);
  return (
    p.status === "DECLINED" ||
    p.status === "INTERVIEW_DECLINED" ||
    p.status === "INTERVIEW_CANCELLED" ||
    p.interview?.status === "CANCELLED" ||
    t.contratado ||
    t.naoContratado ||
    t.entrevistaCancelada
  );
}

export function isEntrevista(p: JobProposalDTO): boolean {
  if (isArquivada(p) || !p.interview) return false;
  return p.status === "INTERVIEW_PENDING" || p.status === "INTERVIEW_CONFIRMED";
}

export function isPropostaAtiva(p: JobProposalDTO): boolean {
  if (isArquivada(p) || isEntrevista(p)) return false;
  return p.status === "SENT" || p.status === "MORE_INFO" || p.status === "INTERESTED";
}

export type JobProposalDTO = {
  id: string;
  profileId: string;
  companyUserId: string;
  companyName: string;
  /** Nome do profissional (preenchido nas listagens da empresa) */
  professionalName?: string;
  cargo: string;
  salario: string;
  turno: string;
  cidade: string;
  beneficios: string;
  mensagem: string;
  status: ProposalStatus;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  interview: JobInterviewDTO | null;
  tracking: ProposalFunnelTracking;
};

export type InterviewComprovanteInput = {
  companyName: string;
  scheduledAt: Date | string;
  locationType: InterviewLocationType;
  address?: string | null;
  meetingUrl?: string | null;
  observacoes: string;
};

function escapePlain(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Bloco único de comprovante (convite e confirmação). */
export function formatInterviewComprovante(input: InterviewComprovanteInput): {
  text: string;
  html: string;
  dataLabel: string;
  horaLabel: string;
  localLabel: string;
} {
  const when = typeof input.scheduledAt === "string" ? new Date(input.scheduledAt) : input.scheduledAt;
  const dataLabel = when.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
  const horaLabel = when.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const localLabel =
    input.locationType === "PLATFORM"
      ? "Pela plataforma Recruta Indústria (chamada de vídeo)"
      : input.locationType === "ONLINE"
        ? `Online — ${String(input.meetingUrl || "").trim() || "link a confirmar"}`
        : `Presencial — ${String(input.address || "").trim() || "endereço a confirmar"}`;

  const obs = String(input.observacoes || "").trim();
  const lines = [
    "Comprovante de agendamento",
    `Empresa: ${input.companyName}`,
    `Data: ${dataLabel}`,
    `Horário: ${horaLabel}`,
    `Local: ${localLabel}`,
    ...(obs ? [`Observações: ${obs}`] : []),
  ];

  const text = lines.join("\n");
  const html = `
    <div style="border:1px solid #c89b3c;border-radius:8px;padding:16px;background:#fffdf6;margin:16px 0;">
      <p style="margin:0 0 10px;font-weight:700;color:#b8860b;text-transform:uppercase;font-size:13px;">Comprovante de agendamento</p>
      <p style="margin:0 0 6px;"><strong>Empresa:</strong> ${escapePlain(input.companyName)}</p>
      <p style="margin:0 0 6px;"><strong>Data:</strong> ${escapePlain(dataLabel)}</p>
      <p style="margin:0 0 6px;"><strong>Horário:</strong> ${escapePlain(horaLabel)}</p>
      <p style="margin:0 ${obs ? "0 6px" : "0"};"><strong>Local:</strong> ${escapePlain(localLabel)}</p>
      ${obs ? `<p style="margin:0;"><strong>Observações:</strong> ${escapePlain(obs)}</p>` : ""}
    </div>`;

  return { text, html, dataLabel, horaLabel, localLabel };
}
