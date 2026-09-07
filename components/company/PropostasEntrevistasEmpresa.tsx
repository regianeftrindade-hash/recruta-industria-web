"use client";

import React, { useState } from "react";
import { DASH, dashCard, dashInput, dashLabel, dashSectionTitle } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import type { JobProposalDTO, InterviewLocationType } from "@/lib/company/job-proposals-shared";
import { formatInterviewComprovante } from "@/lib/company/job-proposals-shared";
import { formatReaisDisplay, maskReaisInput, TURNOS_PROPOSTA, turnoPropostaLabel } from "@/lib/format-reais";

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

  if (!canSend && proposals.length === 0) return null;

  return (
    <section className="dash-card" style={{ ...dashCard, padding: 18 }}>
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
        <div style={{ display: "grid", gap: 12 }}>
          {proposals.map((p) => {
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
                key={p.id}
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

                {(p.status === "INTERESTED" ||
                  (p.status === "INTERVIEW_PENDING" && schedulingId === p.id)) && (
                  <div style={{ marginTop: 8 }}>
                    {schedulingId !== p.id ? (
                      <button
                        type="button"
                        onClick={() => setSchedulingId(p.id)}
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
                              onChange={(e) =>
                                setInterviewForm((f) => ({ ...f, date: e.target.value }))
                              }
                              style={dashInput}
                            />
                          </div>
                          <div>
                            <p style={dashLabel}>Horário</p>
                            <input
                              type="time"
                              value={interviewForm.time}
                              onChange={(e) =>
                                setInterviewForm((f) => ({ ...f, time: e.target.value }))
                              }
                              style={dashInput}
                            />
                          </div>
                        </div>
                        <div>
                          <p style={dashLabel}>Modalidade</p>
                          <select
                            value={interviewForm.locationType}
                            onChange={(e) =>
                              setInterviewForm((f) => ({
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
                                setInterviewForm((f) => ({ ...f, meetingUrl: e.target.value }))
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
                                setInterviewForm((f) => ({ ...f, address: e.target.value }))
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
                              setInterviewForm((f) => ({ ...f, observacoes: e.target.value }))
                            }
                            style={{ ...dashInput, resize: "vertical" }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void agendar(p.id)}
                            style={{ ...btnGold, padding: "8px 12px", fontSize: 12, flex: 1 }}
                          >
                            {saving ? "Enviando..." : "Enviar convite"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSchedulingId(null)}
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
          })}
        </div>
      )}
    </section>
  );
}
