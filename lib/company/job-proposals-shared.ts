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

export type JobInterviewDTO = {
  id: string;
  scheduledAt: string;
  locationType: InterviewLocationType;
  address: string | null;
  meetingUrl: string | null;
  observacoes: string;
  status: InterviewStatus;
};

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
  tracking: {
    contatado: boolean;
    entrevistado: boolean;
    emTeste: boolean;
    contratado: boolean;
    naoContratado: boolean;
    entrevistaCancelada: boolean;
  };
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
