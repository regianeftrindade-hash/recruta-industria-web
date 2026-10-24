"use client";

import React from "react";
import { DASH, dashInput } from "@/lib/dashboard-theme";
import { botaoPerfil, COR_PRETO, textoAviso, textoDourado } from "@/lib/ui/perfil-empresa-cores";
import type { JobProposalDTO, InterviewLocationType } from "@/lib/company/job-proposals-shared";
import { VIDEO_INTERVIEW_PAID_ONLY } from "@/lib/company/company-premium-plans";
import { formatInterviewComprovante } from "@/lib/company/job-proposals-shared";
import { formatReaisDisplay, turnoPropostaLabel } from "@/lib/format-reais";

const STATUS_LABEL: Record<string, string> = {
  SENT: "Aguardando resposta",
  INTERESTED: "Interesse confirmado — agende a entrevista",
  MORE_INFO: "Pediu mais informações",
  DECLINED: "Sem interesse",
  INTERVIEW_PENDING: "Entrevista aguardando confirmação",
  INTERVIEW_CONFIRMED: "Entrevista confirmada",
  INTERVIEW_DECLINED: "Entrevista recusada",
  INTERVIEW_CANCELLED: "Entrevista cancelada",
};

const rotulo: React.CSSProperties = {
  ...textoDourado,
  fontSize: 14,
  textTransform: "uppercase",
  margin: "0 0 4px",
};

const btnGhost: React.CSSProperties = {
  background: "transparent",
  border: "2px solid #000",
  color: COR_PRETO,
  borderRadius: 8,
  padding: "5px 8px",
  fontSize: 10,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

export type InterviewScheduleFormState = {
  date: string;
  time: string;
  locationType: InterviewLocationType;
  address: string;
  meetingUrl: string;
  observacoes: string;
};

type Props = {
  proposal: JobProposalDTO;
  busy: boolean;
  saving: boolean;
  isScheduling: boolean;
  interviewForm: InterviewScheduleFormState;
  videoEntrevistaLiberada: boolean;
  onExcluir: () => void;
  onStartScheduling: () => void;
  onCancelScheduling: () => void;
  onSetInterviewForm: (updater: (prev: InterviewScheduleFormState) => InterviewScheduleFormState) => void;
  onAgendar: () => void;
};

export default function CompanyPropostaCard({
  proposal: p,
  busy,
  saving,
  isScheduling,
  interviewForm,
  videoEntrevistaLiberada,
  onExcluir,
  onStartScheduling,
  onCancelScheduling,
  onSetInterviewForm,
  onAgendar,
}: Props) {
  const comprovante =
    p.interview &&
    formatInterviewComprovante({
      companyName: p.companyName,
      scheduledAt: p.interview.scheduledAt,
      locationType: p.interview.locationType,
      address: p.interview.address,
      meetingUrl: p.interview.meetingUrl,
      observacoes: p.interview.observacoes,
    });

  return (
    <div
      style={{
        border: "2px solid #000",
        borderRadius: 10,
        padding: 12,
        background: DASH.inner,
      }}
    >
      <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: COR_PRETO }}>
        {`${p.cargo} · ${formatReaisDisplay(p.salario)}`}
      </p>
      <p style={{ margin: "0 0 2px", fontSize: 14, color: COR_PRETO }}>
        <strong style={{ color: COR_PRETO }}>Turno:</strong> {turnoPropostaLabel(p.turno)}
      </p>
      {p.cidade?.trim() ? (
        <p style={{ margin: "0 0 2px", fontSize: 14, color: COR_PRETO }}>
          <strong style={{ color: COR_PRETO }}>Cidade:</strong> {p.cidade}
        </p>
      ) : null}
      {p.beneficios?.trim() ? (
        <p style={{ margin: "0 0 6px", fontSize: 14, color: COR_PRETO, whiteSpace: "pre-wrap" }}>
          <strong style={{ color: COR_PRETO }}>Benefícios:</strong> {p.beneficios}
        </p>
      ) : null}
      <p style={{ margin: "0 0 8px", fontSize: 14, ...textoDourado, fontWeight: 700 }}>
        {STATUS_LABEL[p.status] || p.status}
      </p>
      {(p.status === "SENT" || p.status === "MORE_INFO") && (
        <p style={{ margin: "0 0 8px", fontSize: 14, color: COR_PRETO, lineHeight: 1.45 }}>
          {p.status === "MORE_INFO"
            ? "O profissional pediu mais informações. Responda na seção de Mensagens abaixo."
            : "O agendamento fica disponível depois que o profissional confirmar interesse."}
        </p>
      )}
      {p.status === "MORE_INFO" && (
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("empresa-mensagens-candidato");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          style={{ ...botaoPerfil, padding: "8px 12px", fontSize: 12, marginBottom: 8 }}
        >
          Responder em Mensagens
        </button>
      )}
      <button
        type="button"
        className="ri-tinta-aviso"
        disabled={busy || saving}
        onClick={onExcluir}
        style={{
          ...btnGhost,
          marginTop: 8,
          padding: "6px 10px",
          fontSize: 14,
          ...textoAviso,
          borderColor: "#000",
        }}
      >
        Excluir
      </button>
      {comprovante && (
        <div
          style={{
            margin: "8px 0 12px",
            padding: 12,
            borderRadius: 10,
            border: "2px solid #000",
            background: DASH.inner,
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 14,
              fontWeight: 800,
              ...textoDourado,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Comprovante de agendamento
          </p>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: COR_PRETO }}>
            <strong>Empresa:</strong> {p.companyName}
          </p>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: COR_PRETO }}>
            <strong>Data:</strong> {comprovante.dataLabel}
          </p>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: COR_PRETO }}>
            <strong>Horário:</strong> {comprovante.horaLabel}
          </p>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: COR_PRETO }}>
            <strong>Local:</strong> {comprovante.localLabel}
          </p>
          {p.interview?.observacoes?.trim() ? (
            <p style={{ margin: 0, fontSize: 12, color: COR_PRETO, whiteSpace: "pre-wrap" }}>
              <strong>Observações:</strong> {p.interview.observacoes}
            </p>
          ) : null}
        </div>
      )}

      {(p.status === "INTERESTED" || (p.status === "INTERVIEW_PENDING" && isScheduling)) && (
        <div style={{ marginTop: 8 }}>
          {!isScheduling ? (
            <button
              type="button"
              onClick={onStartScheduling}
              style={{ ...botaoPerfil, padding: "8px 12px", fontSize: 12 }}
            >
              Agendar Entrevista
            </button>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <p style={rotulo}>Data</p>
                  <input
                    type="date"
                    value={interviewForm.date}
                    onChange={(e) => onSetInterviewForm((f) => ({ ...f, date: e.target.value }))}
                    style={dashInput}
                  />
                </div>
                <div>
                  <p style={rotulo}>Horário</p>
                  <input
                    type="time"
                    value={interviewForm.time}
                    onChange={(e) => onSetInterviewForm((f) => ({ ...f, time: e.target.value }))}
                    style={dashInput}
                  />
                </div>
              </div>
              <div>
                <p style={rotulo}>Modalidade</p>
                <select
                  value={interviewForm.locationType}
                  onChange={(e) =>
                    onSetInterviewForm((f) => ({
                      ...f,
                      locationType: e.target.value as InterviewLocationType,
                    }))
                  }
                  style={dashInput}
                >
                  <option value="ONLINE">Online (Meet / Teams)</option>
                  <option value="PRESENTIAL">Presencial</option>
                  <option value="PLATFORM" disabled={!videoEntrevistaLiberada}>
                    Pela plataforma (vídeo Recruta)
                  </option>
                </select>
                {!videoEntrevistaLiberada ? (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: COR_PRETO, lineHeight: 1.4 }}>
                    {VIDEO_INTERVIEW_PAID_ONLY}
                  </p>
                ) : null}
              </div>
              {interviewForm.locationType === "ONLINE" ? (
                <div>
                  <p style={rotulo}>Link (Google Meet ou Teams)</p>
                  <input
                    value={interviewForm.meetingUrl}
                    placeholder="https://meet.google.com/..."
                    onChange={(e) =>
                      onSetInterviewForm((f) => ({ ...f, meetingUrl: e.target.value }))
                    }
                    style={dashInput}
                  />
                </div>
              ) : interviewForm.locationType === "PRESENTIAL" ? (
                <div>
                  <p style={rotulo}>Endereço</p>
                  <input
                    value={interviewForm.address}
                    placeholder="Rua, número, cidade"
                    onChange={(e) =>
                      onSetInterviewForm((f) => ({ ...f, address: e.target.value }))
                    }
                    style={dashInput}
                  />
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 14, color: COR_PRETO, lineHeight: 1.45 }}>
                  A entrevista será pela chamada de vídeo da plataforma. Não é necessário link externo.
                </p>
              )}
              <div>
                <p style={rotulo}>Observações (opcional)</p>
                <textarea
                  value={interviewForm.observacoes}
                  rows={3}
                  placeholder="Ex.: trazer RG, entrar pelo portão 2..."
                  onChange={(e) =>
                    onSetInterviewForm((f) => ({ ...f, observacoes: e.target.value }))
                  }
                  style={{ ...dashInput, resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={onAgendar}
                  style={{ ...botaoPerfil, padding: "8px 12px", fontSize: 12, flex: 1 }}
                >
                  {saving ? "Enviando..." : "Enviar convite"}
                </button>
                <button
                  type="button"
                  onClick={onCancelScheduling}
                  style={{
                    background: "transparent",
                    border: "2px solid #000",
                    color: COR_PRETO,
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
