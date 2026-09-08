"use client";

import React, { useMemo, useState } from "react";
import { DASH, dashCard, dashInput, dashLabel, dashSectionTitle } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import type { JobProposalDTO, InterviewLocationType } from "@/lib/company/job-proposals-shared";
import { formatInterviewComprovante } from "@/lib/company/job-proposals-shared";
import { formatReaisDisplay, maskReaisInput, TURNOS_PROPOSTA } from "@/lib/format-reais";
import {
  isArquivada,
  isEntrevista,
  isPropostaAtiva,
} from "@/components/professional/ProfessionalOpportunityBoard";
import CompanyPropostaCard from "@/components/company/CompanyPropostaCard";

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

type Props = {
  profileId: string;
  canSend: boolean;
  proposals: JobProposalDTO[];
  onChanged: () => void;
};

export default function PropostasEntrevistasEmpresa({
  profileId,
  canSend,
  proposals,
  onChanged,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({
    cargo: "",
    salario: "",
    turno: "",
    cidade: "",
    beneficios: "",
    mensagem:
      "Gostamos do seu perfil e gostaríamos de saber se você tem interesse nesta oportunidade.",
  });

  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [interviewForm, setInterviewForm] = useState({
    date: "",
    time: "",
    locationType: "ONLINE" as InterviewLocationType,
    address: "",
    meetingUrl: "",
    observacoes: "",
  });

  const enviarProposta = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/company/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao enviar proposta");
        return;
      }
      setShowForm(false);
      setForm((f) => ({
        ...f,
        cargo: "",
        salario: "",
        turno: "",
        cidade: "",
        beneficios: "",
      }));
      onChanged();
      alert("Proposta enviada! O profissional receberá no painel e por e-mail.");
    } catch {
      alert("Erro ao enviar proposta");
    } finally {
      setSaving(false);
    }
  };

  const agendar = async (proposalId: string) => {
    if (!interviewForm.date || !interviewForm.time) {
      alert("Preencha data e horário.");
      return;
    }
    setSaving(true);
    try {
      const scheduledAt = new Date(`${interviewForm.date}T${interviewForm.time}:00`);
      const res = await fetch(`/api/company/proposals/${proposalId}/interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scheduledAt: scheduledAt.toISOString(),
          locationType: interviewForm.locationType,
          address: interviewForm.address,
          meetingUrl: interviewForm.meetingUrl,
          observacoes: interviewForm.observacoes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao agendar");
        return;
      }
      setSchedulingId(null);
      setInterviewForm({
        date: "",
        time: "",
        locationType: "ONLINE",
        address: "",
        meetingUrl: "",
        observacoes: "",
      });
      onChanged();
    } catch {
      alert("Erro ao agendar entrevista");
    } finally {
      setSaving(false);
    }
  };

  const listas = useMemo(() => {
    const propostas = proposals.filter(isPropostaAtiva);
    const entrevistas = proposals.filter(isEntrevista).sort((a, b) => {
      const ta = a.interview ? new Date(a.interview.scheduledAt).getTime() : 0;
      const tb = b.interview ? new Date(b.interview.scheduledAt).getTime() : 0;
      return ta - tb;
    });
    const arquivadas = proposals.filter(isArquivada);
    return { propostas, entrevistas, arquivadas };
  }, [proposals]);

  const trackingOf = (p: JobProposalDTO) =>
    p.tracking || {
      contatado: false,
      entrevistado: false,
      emTeste: false,
      contratado: false,
      naoContratado: false,
      entrevistaCancelada: false,
    };

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

  const excluir = async (id: string) => {
    if (
      !confirm(
        "Excluir esta proposta? Ela some também para o profissional. Use isso se a empresa se arrependeu de enviar.",
      )
    ) {
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/company/proposals/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao excluir");
        return;
      }
      onChanged();
    } catch {
      alert("Erro ao excluir");
    } finally {
      setBusyId(null);
    }
  };

  const toggleFunil = async (
    p: JobProposalDTO,
    campo: "emTeste" | "contratado" | "naoContratado" | "entrevistaCancelada",
    atual: boolean,
  ) => {
    setBusyId(p.id);
    try {
      const body: Record<string, unknown> = { [campo]: !atual };
      if (campo === "contratado" && !atual) body.naoContratado = false;
      if (campo === "naoContratado" && !atual) body.contratado = false;

      if (campo === "entrevistaCancelada" && !atual) {
        const justification = window.prompt(
          "Justificativa do cancelamento da entrevista (opcional):",
          "",
        );
        if (justification === null) {
          setBusyId(null);
          return;
        }
        const cancelRes = await fetch(
          `/api/company/proposals/${encodeURIComponent(p.id)}/interview/cancel`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              justification: justification.trim() || "Cancelada pela empresa",
            }),
          },
        );
        const cancelData = await cancelRes.json();
        if (!cancelRes.ok) {
          alert(cancelData.error || "Erro ao cancelar entrevista");
          setBusyId(null);
          return;
        }
      }

      const res = await fetch(`/api/company/proposals/${encodeURIComponent(p.id)}/funnel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao atualizar");
        return;
      }
      onChanged();
    } catch {
      alert("Erro ao atualizar acompanhamento");
    } finally {
      setBusyId(null);
    }
  };

  const funilBotoes = (p: JobProposalDTO) => {
    const t = trackingOf(p);
    const busy = busyId === p.id || saving;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
        <button type="button" disabled={busy} onClick={() => void toggleFunil(p, "emTeste", t.emTeste)} style={chip(t.emTeste)}>
          {t.emTeste ? "✓ " : ""}Em teste
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void toggleFunil(p, "entrevistaCancelada", t.entrevistaCancelada)}
          style={chip(t.entrevistaCancelada)}
        >
          {t.entrevistaCancelada ? "✓ " : ""}Entrevista cancelada
        </button>
        <button type="button" disabled={busy} onClick={() => void toggleFunil(p, "contratado", t.contratado)} style={chip(t.contratado)}>
          {t.contratado ? "✓ " : ""}Contratado
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void toggleFunil(p, "naoContratado", t.naoContratado)}
          style={chip(t.naoContratado)}
        >
          {t.naoContratado ? "✓ " : ""}Não contratado
        </button>
      </div>
    );
  };

  const botaoExcluir = (id: string) => (
    <button
      type="button"
      disabled={busyId === id || saving}
      onClick={() => void excluir(id)}
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
  );

  const cardBase: React.CSSProperties = {
    border: `1px solid ${DASH.gold}`,
    borderRadius: 10,
    padding: 12,
    background: DASH.inner,
    minWidth: 0,
    maxWidth: "100%",
    boxSizing: "border-box",
  };

  if (!canSend && proposals.length === 0) return null;

  return (
    <section className="dash-card" style={{ ...dashCard, padding: 18, minWidth: 0, maxWidth: "100%", boxSizing: "border-box" }}>
      <h3 style={{ ...dashSectionTitle, color: DASH.gold, margin: "0 0 12px", fontSize: 16 }}>
        Propostas e entrevistas
      </h3>

      {canSend && (
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          style={{ ...btnGold, width: "100%", padding: "10px 14px", fontSize: 13, marginBottom: 12 }}
        >
          {showForm ? "Fechar formulário" : "Enviar Proposta"}
        </button>
      )}

      {showForm && (
        <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
          <div>
            <p style={dashLabel}>Cargo</p>
            <input
              value={form.cargo}
              placeholder="Inspetor de Qualidade"
              onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}
              style={dashInput}
            />
          </div>
          <div>
            <p style={dashLabel}>Salário (R$)</p>
            <input
              value={form.salario}
              placeholder="R$ 4.200"
              inputMode="numeric"
              onChange={(e) => setForm((f) => ({ ...f, salario: maskReaisInput(e.target.value) }))}
              style={dashInput}
            />
          </div>
          <div>
            <p style={dashLabel}>Turno</p>
            <select
              value={form.turno}
              onChange={(e) => setForm((f) => ({ ...f, turno: e.target.value }))}
              style={dashInput}
            >
              <option value="">Selecione</option>
              {TURNOS_PROPOSTA.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p style={dashLabel}>Cidade</p>
            <input
              value={form.cidade}
              placeholder="Campinas/SP"
              onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))}
              style={dashInput}
            />
          </div>
          <div>
            <p style={dashLabel}>Benefícios</p>
            <textarea
              value={form.beneficios}
              placeholder={"Convênio médico\nVA R$ 500\nPLR"}
              rows={3}
              onChange={(e) => setForm((f) => ({ ...f, beneficios: e.target.value }))}
              style={{ ...dashInput, resize: "vertical" }}
            />
          </div>
          <div>
            <p style={dashLabel}>Mensagem</p>
            <textarea
              value={form.mensagem}
              rows={3}
              onChange={(e) => setForm((f) => ({ ...f, mensagem: e.target.value }))}
              style={{ ...dashInput, resize: "vertical" }}
            />
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void enviarProposta()}
            style={{ ...btnGold, padding: "10px", fontSize: 13, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Enviando..." : "Enviar proposta"}
          </button>
        </div>
      )}

      {proposals.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>
          Nenhuma proposta enviada ainda para este profissional.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: DASH.gold }}>
              Propostas ativas ({listas.propostas.length})
            </h4>
            {listas.propostas.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>Nenhuma proposta ativa.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {listas.propostas.map((p) => (
                  <CompanyPropostaCard
                    key={p.id}
                    proposal={p}
                    busy={busyId === p.id}
                    saving={saving}
                    isScheduling={schedulingId === p.id}
                    interviewForm={interviewForm}
                    onExcluir={() => void excluir(p.id)}
                    onStartScheduling={() => setSchedulingId(p.id)}
                    onCancelScheduling={() => setSchedulingId(null)}
                    onSetInterviewForm={setInterviewForm}
                    onAgendar={() => void agendar(p.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: DASH.gold }}>
              Entrevistas agendadas ({listas.entrevistas.length})
            </h4>
            {listas.entrevistas.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>Nenhuma entrevista agendada.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {listas.entrevistas.map((p) => {
                  if (!p.interview) return null;
                  const comprovante = formatInterviewComprovante({
                    companyName: p.companyName,
                    scheduledAt: p.interview.scheduledAt,
                    locationType: p.interview.locationType,
                    address: p.interview.address,
                    meetingUrl: p.interview.meetingUrl,
                    observacoes: p.interview.observacoes,
                  });
                  return (
                    <div key={p.id} style={cardBase}>
                      <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: DASH.text }}>
                        {p.cargo} · {formatReaisDisplay(p.salario)}
                      </p>
                      <p style={{ margin: "0 0 2px", fontSize: 11, color: DASH.gold, fontWeight: 700 }}>
                        {STATUS_LABEL[p.status] || p.status}
                      </p>
                      <p style={{ margin: "0 0 2px", fontSize: 11, color: DASH.muted }}>
                        {comprovante.dataLabel} · {comprovante.horaLabel}
                      </p>
                      <p style={{ margin: "0 0 4px", fontSize: 11, color: DASH.text }}>{comprovante.localLabel}</p>
                      {p.interview.observacoes?.trim() ? (
                        <p style={{ margin: "0 0 4px", fontSize: 12, color: DASH.text, whiteSpace: "pre-wrap" }}>
                          <strong>Observação:</strong> {p.interview.observacoes.trim()}
                        </p>
                      ) : null}
                      {funilBotoes(p)}
                      {botaoExcluir(p.id)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: DASH.gold }}>
              Arquivadas ({listas.arquivadas.length})
            </h4>
            {listas.arquivadas.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>Nenhum item arquivado.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {listas.arquivadas.map((p) => {
                  const t = trackingOf(p);
                  const motivo = t.contratado
                    ? "Contratado"
                    : t.naoContratado
                      ? "Não contratado"
                      : t.entrevistaCancelada || p.status === "INTERVIEW_CANCELLED"
                        ? "Entrevista cancelada"
                        : p.status === "DECLINED"
                          ? "Sem interesse"
                          : p.status === "INTERVIEW_DECLINED"
                            ? "Entrevista recusada"
                            : "Arquivada";
                  return (
                    <div key={p.id} style={cardBase}>
                      <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: DASH.text }}>
                        {p.cargo} · {formatReaisDisplay(p.salario)}
                      </p>
                      <p style={{ margin: "0 0 8px", fontSize: 11, color: DASH.gold }}>{motivo}</p>
                      {botaoExcluir(p.id)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
