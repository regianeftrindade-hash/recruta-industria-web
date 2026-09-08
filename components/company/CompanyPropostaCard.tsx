"use client";

import React from "react";
import { DASH, dashInput, dashLabel } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import type { JobProposalDTO, InterviewLocationType } from "@/lib/company/job-proposals-shared";
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

const btnGhost: React.CSSProperties = {
  background: "transparent",
  border: `1px solid ${DASH.border}`,
  color: DASH.text,
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
        border: `1px solid ${DASH.gold}`,
        borderRadius: 10,
        padding: 12,
        background: DASH.inner,
      }}
    >
      <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: DASH.text }}>
        {`${p.cargo} · ${formatReaisDisplay(p.salario)}`}
      </p>
      <p style={{ margin: "0 0 2px", fontSize: 11, color: DASH.muted }}>
        <strong style={{ color: DASH.text }}>Turno:</strong> {turnoPropostaLabel(p.turno)}
      </p>
      {p.cidade?.trim() ? (
        <p style={{ margin: "0 0 2px", fontSize: 11, color: DASH.muted }}>
          <strong style={{ color: DASH.text }}>Cidade:</strong> {p.cidade}
        </p>
      ) : null}
      {p.beneficios?.trim() ? (
        <p style={{ margin: "0 0 6px", fontSize: 11, color: DASH.muted, whiteSpace: "pre-wrap" }}>
          <strong style={{ color: DASH.text }}>Benefícios:</strong> {p.beneficios}
        </p>
      ) : null}
      <p style={{ margin: "0 0 8px", fontSize: 11, color: DASH.gold, fontWeight: 700 }}>
        {STATUS_LABEL[p.status] || p.status}
      </p>
      {(p.status === "SENT" || p.status === "MORE_INFO") && (
        <p style={{ margin: "0 0 8px", fontSize: 11, color: DASH.muted, lineHeight: 1.45 }}>
          O agendamento fica disponível depois que o profissional confirmar interesse.
        </p>
      )}
      <button
        type="button"
        disabled={busy || saving}
        onClick={onExcluir}
        style={{
          ...btnGhost,
          marginTop: 8,
          padding: "6px 10px",
          fontSize: 11,
          color: "#e57373",
          borderColor: "rgba(229,115,115,0.55)",
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
            border: `1px solid ${DASH.gold}`,
            background: "rgba(200,155,60,0.08)",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 11,
              fontWeight: 800,
              color: DASH.gold,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Comprovante de agendamento
          </p>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: DASH.text }}>
            <strong>Empresa:</strong> {p.companyName}
          </p>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: DASH.text }}>
            <strong>Data:</strong> {comprovante.dataLabel}
          </p>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: DASH.text }}>
            <strong>Horário:</strong> {comprovante.horaLabel}
          </p>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: DASH.text }}>
            <strong>Local:</strong> {comprovante.localLabel}
          </p>
          {p.interview?.observacoes?.trim() ? (
            <p style={{ margin: 0, fontSize: 12, color: DASH.text, whiteSpace: "pre-wrap" }}>
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
              style={{ ...btnGold, padding: "8px 12px", fontSize: 12 }}
            >
              Agendar Entrevista
            </button>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <p style={dashLabel}>Data</p>
                  <input
                    type="date"
                    value={interviewForm.date}
                    onChange={(e) => onSetInterviewForm((f) => ({ ...f, date: e.target.value }))}
                    style={dashInput}
                  />
                </div>
                <div>
                  <p style={dashLabel}>Horário</p>
                  <input
                    type="time"
                    value={interviewForm.time}
                    onChange={(e) => onSetInterviewForm((f) => ({ ...f, time: e.target.value }))}
                    style={dashInput}
                  />
                </div>
              </div>
              <div>
                <p style={dashLabel}>Modalidade</p>
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
                  <option value="PLATFORM">Pela plataforma (vídeo Recruta)</option>
                </select>
              </div>
              {interviewForm.locationType === "ONLINE" ? (
                <div>
                  <p style={dashLabel}>Link (Google Meet ou Teams)</p>
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
                  <p style={dashLabel}>Endereço</p>
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
                <p style={{ margin: 0, fontSize: 11, color: DASH.muted, lineHeight: 1.45 }}>
                  A entrevista será pela chamada de vídeo da plataforma. Não é necessário link externo.
                </p>
              )}
              <div>
                <p style={dashLabel}>Observações (opcional)</p>
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
                  style={{ ...btnGold, padding: "8px 12px", fontSize: 12, flex: 1 }}
                >
                  {saving ? "Enviando..." : "Enviar convite"}
                </button>
                <button
                  type="button"
                  onClick={onCancelScheduling}
                  style={{
                    background: "transparent",
                    border: `1px solid ${DASH.border}`,
                    color: DASH.muted,
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
