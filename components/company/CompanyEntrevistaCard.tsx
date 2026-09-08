"use client";

import React from "react";
import { DASH, dashInnerBox } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import type { JobProposalDTO } from "@/lib/company/job-proposals-shared";
import { formatInterviewComprovante } from "@/lib/company/job-proposals-shared";

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "nowrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  border: `1px solid ${DASH.border}`,
  borderRadius: 14,
  background: DASH.inner,
};

const nestedCard: React.CSSProperties = {
  ...dashInnerBox,
  padding: 12,
  background: DASH.inner,
};

function trackingOf(p: JobProposalDTO) {
  return (
    p.tracking || {
      contatado: false,
      entrevistado: false,
      emTeste: false,
      contratado: false,
      naoContratado: false,
      entrevistaCancelada: false,
    }
  );
}

const chip = (active: boolean): React.CSSProperties => ({
  padding: "5px 8px",
  fontSize: 10,
  fontWeight: 700,
  borderRadius: 8,
  cursor: "pointer",
  whiteSpace: "nowrap",
  flexShrink: 0,
  border: `1px solid ${active ? DASH.gold : DASH.border}`,
  background: active ? "rgba(200,155,60,0.22)" : "transparent",
  color: active ? DASH.gold : DASH.muted,
  fontFamily: "inherit",
});

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

export type RescheduleFormState = {
  date: string;
  time: string;
  locationType: "PRESENTIAL" | "ONLINE" | "PLATFORM";
  address: string;
  meetingUrl: string;
  observacoes: string;
};

export type CancelMode = "menu" | "justify" | "reschedule" | null;

type FunilCampo = "entrevistado" | "emTeste" | "contratado" | "naoContratado";

type Props = {
  proposal: JobProposalDTO;
  busy: boolean;
  cancelOpen: boolean;
  cancelMode: CancelMode;
  justification: string;
  rescheduleForm: RescheduleFormState;
  onExcluir: () => void;
  onToggleFunil: (campo: FunilCampo, atual: boolean) => void;
  onAbrirCancelar: () => void;
  onFecharCancelar: () => void;
  onSetCancelMode: (mode: CancelMode) => void;
  onSetJustification: (value: string) => void;
  onSetRescheduleForm: (updater: (prev: RescheduleFormState) => RescheduleFormState) => void;
  onCancelarComJustificativa: () => void;
  onReagendar: () => void;
  onPerfil: () => void;
};

export default function CompanyEntrevistaCard({
  proposal: p,
  busy,
  cancelOpen,
  cancelMode,
  justification,
  rescheduleForm,
  onExcluir,
  onToggleFunil,
  onAbrirCancelar,
  onFecharCancelar,
  onSetCancelMode,
  onSetJustification,
  onSetRescheduleForm,
  onCancelarComJustificativa,
  onReagendar,
  onPerfil,
}: Props) {
  if (!p.interview) return null;

  const t = trackingOf(p);
  const comprovante = formatInterviewComprovante({
    companyName: p.companyName,
    scheduledAt: p.interview.scheduledAt,
    locationType: p.interview.locationType,
    address: p.interview.address,
    meetingUrl: p.interview.meetingUrl,
    observacoes: p.interview.observacoes,
  });
  const nomeProf = p.professionalName || "Profissional";

  return (
    <article style={{ ...rowStyle, flexWrap: "wrap", alignItems: "flex-start" }}>
      <button
        type="button"
        disabled={busy}
        onClick={onExcluir}
        style={{ ...btnGhost, color: "#e57373", borderColor: "rgba(229,115,115,0.55)" }}
      >
        Excluir
      </button>
      <div style={{ flex: "1 1 180px", minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 800,
            color: DASH.gold,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {nomeProf} · {p.cargo}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 10, color: DASH.muted }}>
          {comprovante.dataLabel} · {comprovante.horaLabel}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 10, color: DASH.text }}>{comprovante.localLabel}</p>
        {p.interview.observacoes?.trim() ? (
          <p style={{ margin: "6px 0 0", fontSize: 11, color: DASH.text, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            <strong style={{ color: DASH.gold }}>Observação:</strong> {p.interview.observacoes.trim()}
          </p>
        ) : null}
        <p style={{ margin: "4px 0 0", fontSize: 9, color: DASH.muted }}>
          {p.status === "INTERVIEW_CONFIRMED" ? "Confirmada pelo profissional" : "Aguardando confirmação"}
        </p>
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          flexShrink: 0,
          flexWrap: "wrap",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggleFunil("entrevistado", t.entrevistado)}
          style={chip(t.entrevistado)}
        >
          Entrevistado
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggleFunil("emTeste", t.emTeste)}
          style={chip(t.emTeste)}
        >
          Em teste
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggleFunil("contratado", t.contratado)}
          style={chip(t.contratado)}
        >
          Contratado
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggleFunil("naoContratado", t.naoContratado)}
          style={chip(t.naoContratado)}
        >
          Não contratado
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => (cancelOpen ? onFecharCancelar() : onAbrirCancelar())}
          style={{ ...btnGhost, color: "#e57373", borderColor: "rgba(229,115,115,0.55)" }}
        >
          Cancelar
        </button>
        <button type="button" onClick={onPerfil} style={{ ...btnGold, padding: "5px 8px", fontSize: 10 }}>
          Perfil
        </button>
      </div>

      {cancelOpen && cancelMode === "menu" && (
        <div style={{ width: "100%", marginTop: 8, ...nestedCard }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: DASH.text, fontWeight: 700 }}>
            Cancelar entrevista — escolha uma opção:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              disabled={busy}
              onClick={() => onSetCancelMode("reschedule")}
              style={{ ...btnGold, padding: "8px 12px", fontSize: 12 }}
            >
              Reagendar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onSetCancelMode("justify")}
              style={{ ...btnGhost, padding: "8px 12px", fontSize: 12 }}
            >
              Informar justificativa
            </button>
            <button type="button" disabled={busy} onClick={onFecharCancelar} style={btnGhost}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {cancelOpen && cancelMode === "justify" && (
        <div style={{ width: "100%", marginTop: 8, ...nestedCard }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: DASH.text }}>
            Justificativa do cancelamento
          </p>
          <textarea
            value={justification}
            onChange={(e) => onSetJustification(e.target.value)}
            rows={3}
            placeholder="Explique o motivo do cancelamento para o profissional…"
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 8,
              border: `1px solid ${DASH.border}`,
              background: DASH.card,
              color: DASH.text,
              padding: 8,
              fontSize: 12,
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={busy}
              onClick={onCancelarComJustificativa}
              style={{ ...btnGold, padding: "8px 12px", fontSize: 12 }}
            >
              Confirmar cancelamento
            </button>
            <button type="button" disabled={busy} onClick={() => onSetCancelMode("menu")} style={btnGhost}>
              Voltar
            </button>
          </div>
        </div>
      )}

      {cancelOpen && cancelMode === "reschedule" && (
        <div style={{ width: "100%", marginTop: 8, ...nestedCard, display: "grid", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: DASH.text }}>
            Reagendar entrevista
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 10, color: DASH.muted }}>Data</p>
              <input
                type="date"
                value={rescheduleForm.date}
                onChange={(e) => onSetRescheduleForm((f) => ({ ...f, date: e.target.value }))}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 8,
                  borderRadius: 8,
                  border: `1px solid ${DASH.border}`,
                  background: DASH.card,
                  color: DASH.text,
                }}
              />
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 10, color: DASH.muted }}>Horário</p>
              <input
                type="time"
                value={rescheduleForm.time}
                onChange={(e) => onSetRescheduleForm((f) => ({ ...f, time: e.target.value }))}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 8,
                  borderRadius: 8,
                  border: `1px solid ${DASH.border}`,
                  background: DASH.card,
                  color: DASH.text,
                }}
              />
            </div>
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 10, color: DASH.muted }}>Local</p>
            <select
              value={rescheduleForm.locationType}
              onChange={(e) =>
                onSetRescheduleForm((f) => ({
                  ...f,
                  locationType: e.target.value as "PRESENTIAL" | "ONLINE" | "PLATFORM",
                }))
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 8,
                borderRadius: 8,
                border: `1px solid ${DASH.border}`,
                background: DASH.card,
                color: DASH.text,
              }}
            >
              <option value="PLATFORM">Pela plataforma</option>
              <option value="ONLINE">Online (Meet/Teams)</option>
              <option value="PRESENTIAL">Presencial</option>
            </select>
          </div>
          {rescheduleForm.locationType === "ONLINE" && (
            <input
              type="url"
              placeholder="Link Meet/Teams"
              value={rescheduleForm.meetingUrl}
              onChange={(e) => onSetRescheduleForm((f) => ({ ...f, meetingUrl: e.target.value }))}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 8,
                borderRadius: 8,
                border: `1px solid ${DASH.border}`,
                background: DASH.card,
                color: DASH.text,
              }}
            />
          )}
          {rescheduleForm.locationType === "PRESENTIAL" && (
            <input
              type="text"
              placeholder="Endereço"
              value={rescheduleForm.address}
              onChange={(e) => onSetRescheduleForm((f) => ({ ...f, address: e.target.value }))}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 8,
                borderRadius: 8,
                border: `1px solid ${DASH.border}`,
                background: DASH.card,
                color: DASH.text,
              }}
            />
          )}
          <textarea
            rows={2}
            placeholder="Observações (opcional)"
            value={rescheduleForm.observacoes}
            onChange={(e) => onSetRescheduleForm((f) => ({ ...f, observacoes: e.target.value }))}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 8,
              borderRadius: 8,
              border: `1px solid ${DASH.border}`,
              background: DASH.card,
              color: DASH.text,
              fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={busy}
              onClick={onReagendar}
              style={{ ...btnGold, padding: "8px 12px", fontSize: 12 }}
            >
              Confirmar reagendamento
            </button>
            <button type="button" disabled={busy} onClick={() => onSetCancelMode("menu")} style={btnGhost}>
              Voltar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
