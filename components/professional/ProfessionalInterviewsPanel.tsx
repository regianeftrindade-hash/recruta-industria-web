"use client";

import React, { useState } from "react";
import { DASH, dashCard, dashSectionTitle } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import type { JobProposalDTO } from "@/lib/company/job-proposals-shared";
import { formatInterviewComprovante } from "@/lib/company/job-proposals-shared";

type Props = {
  proposals: JobProposalDTO[];
  onChanged: () => void;
};

const ENTREVISTA_STATUS = new Set([
  "INTERVIEW_PENDING",
  "INTERVIEW_CONFIRMED",
  "INTERVIEW_DECLINED",
]);

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

export function filtrarPropostasComEntrevista(proposals: JobProposalDTO[]): JobProposalDTO[] {
  return proposals.filter(
    (p) =>
      p.interview &&
      (ENTREVISTA_STATUS.has(p.status) ||
        p.interview.status === "PENDING" ||
        p.interview.status === "CONFIRMED"),
  );
}

export default function ProfessionalInterviewsPanel({ proposals, onChanged }: Props) {
  const entrevistas = filtrarPropostasComEntrevista(proposals).sort((a, b) => {
    const ta = a.interview ? new Date(a.interview.scheduledAt).getTime() : 0;
    const tb = b.interview ? new Date(b.interview.scheduledAt).getTime() : 0;
    return ta - tb;
  });

  const [busyId, setBusyId] = useState<string | null>(null);

  const responderEntrevista = async (id: string, action: "CONFIRM" | "DECLINE") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/professional/proposals/${id}/interview-respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao responder entrevista");
        return;
      }
      onChanged();
    } catch {
      alert("Erro ao responder entrevista");
    } finally {
      setBusyId(null);
    }
  };

  const toggleFunil = async (
    id: string,
    campo: "contatado" | "emTeste" | "contratado" | "entrevistado" | "entrevistaCancelada",
    atual: boolean,
  ) => {
    setBusyId(id);
    try {
      const body: Record<string, unknown> = { [campo]: !atual };
      if (campo === "entrevistaCancelada" && !atual) {
        const justification = window.prompt(
          "Justificativa do cancelamento da entrevista (opcional):",
          "",
        );
        if (justification === null) {
          setBusyId(null);
          return;
        }
        body.justification = justification.trim() || "Cancelada pelo profissional";
      }
      const res = await fetch(`/api/professional/proposals/${id}/funnel`, {
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
      alert("Erro ao atualizar histórico");
    } finally {
      setBusyId(null);
    }
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

  return (
    <section style={{ ...dashCard, padding: 14, boxShadow: DASH.shadow }}>
      <h3 style={{ ...dashSectionTitle, color: DASH.gold, margin: "0 0 6px", fontSize: 14 }}>
        📅 Entrevistas agendadas ({entrevistas.length})
      </h3>
      <p style={{ margin: "0 0 10px", fontSize: 10, color: DASH.muted, lineHeight: 1.45 }}>
        Use Contatado / Teste / Contratado no fim da linha para o histórico.
      </p>

      {entrevistas.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>
          Nenhuma entrevista agendada no momento.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {entrevistas.map((p) => {
            if (!p.interview) return null;
            const busy = busyId === p.id;
            const t = p.tracking || {
              contatado: false,
              entrevistado: false,
              emTeste: false,
              contratado: false,
              naoContratado: false,
              entrevistaCancelada: false,
            };
            const comprovante = formatInterviewComprovante({
              companyName: p.companyName,
              scheduledAt: p.interview.scheduledAt,
              locationType: p.interview.locationType,
              address: p.interview.address,
              meetingUrl: p.interview.meetingUrl,
              observacoes: p.interview.observacoes,
            });

            return (
              <article key={p.id} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
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
                    {p.companyName} · {p.cargo}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 10,
                      color: DASH.muted,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {comprovante.dataLabel} · {comprovante.horaLabel} · {comprovante.localLabel}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "nowrap",
                    gap: 4,
                    justifyContent: "flex-end",
                    flexShrink: 0,
                    marginLeft: "auto",
                    alignItems: "center",
                  }}
                >
                  {p.status === "INTERVIEW_PENDING" && (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void responderEntrevista(p.id, "CONFIRM")}
                        style={{ ...btnGold, padding: "5px 8px", fontSize: 10, whiteSpace: "nowrap" }}
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void responderEntrevista(p.id, "DECLINE")}
                        style={{ ...btnGhost, color: "#e57373" }}
                      >
                        Recusar
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void toggleFunil(p.id, "contatado", t.contatado)}
                    style={chip(t.contatado)}
                  >
                    {t.contatado ? "✓ " : ""}Contatado
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void toggleFunil(p.id, "emTeste", t.emTeste)}
                    style={chip(t.emTeste)}
                  >
                    {t.emTeste ? "✓ " : ""}Teste
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void toggleFunil(p.id, "entrevistaCancelada", t.entrevistaCancelada)
                    }
                    style={chip(t.entrevistaCancelada)}
                  >
                    {t.entrevistaCancelada ? "✓ " : ""}Entrevista cancelada
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void toggleFunil(p.id, "contratado", t.contratado)}
                    style={chip(t.contratado)}
                  >
                    {t.contratado ? "✓ " : ""}Contratado
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
