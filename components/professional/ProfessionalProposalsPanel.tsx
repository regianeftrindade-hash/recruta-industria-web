"use client";

import React, { useState } from "react";
import { DASH, dashCard, dashSectionTitle } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import type { JobProposalDTO } from "@/lib/company/job-proposals-shared";
import { AVISO_RETENCAO_PROPOSTAS } from "@/lib/profile/inbox-retention";
import { formatReaisDisplay, turnoPropostaLabel } from "@/lib/format-reais";

type Props = {
  proposals: JobProposalDTO[];
  onChanged: () => void;
};

const STATUS_ENTREVISTA = new Set([
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

export default function ProfessionalProposalsPanel({ proposals, onChanged }: Props) {
  const lista = proposals.filter((p) => !STATUS_ENTREVISTA.has(p.status));
  const [busyId, setBusyId] = useState<string | null>(null);

  const responder = async (id: string, action: "INTERESTED" | "MORE_INFO" | "DECLINED") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/professional/proposals/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao responder");
        return;
      }
      onChanged();
      if (action === "INTERESTED") {
        alert("Interesse registrado. A empresa poderá agendar a entrevista.");
      } else if (action === "MORE_INFO") {
        alert("Pedido de mais informações enviado. Acompanhe também em Mensagens.");
      }
    } catch {
      alert("Erro ao responder proposta");
    } finally {
      setBusyId(null);
    }
  };

  const btnGhost: React.CSSProperties = {
    background: "transparent",
    border: `1px solid ${DASH.border}`,
    color: DASH.text,
    borderRadius: 8,
    padding: "6px 8px",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  return (
    <section style={{ ...dashCard, padding: 14, boxShadow: DASH.shadow }}>
      <h3 style={{ ...dashSectionTitle, color: DASH.gold, margin: "0 0 6px", fontSize: 14 }}>
        🔔 Propostas recebidas ({lista.length})
      </h3>
      <p style={{ margin: "0 0 10px", fontSize: 10, color: DASH.muted, lineHeight: 1.45 }}>
        {AVISO_RETENCAO_PROPOSTAS}
      </p>

      {lista.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>
          Quando uma empresa enviar proposta, ela aparecerá aqui.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {lista.map((p) => {
            const busy = busyId === p.id;
            const detalhe = [
              formatReaisDisplay(p.salario),
              turnoPropostaLabel(p.turno),
              p.cidade?.trim() || null,
            ]
              .filter(Boolean)
              .join(" · ");

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
                    {p.companyName}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 12,
                      fontWeight: 700,
                      color: DASH.text,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.cargo}
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
                    {detalhe}
                  </p>
                </div>

                <div style={{ display: "flex", flexWrap: "nowrap", gap: 4, justifyContent: "flex-end", flexShrink: 0, marginLeft: "auto" }}>
                  {(p.status === "SENT" || p.status === "MORE_INFO") && (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void responder(p.id, "INTERESTED")}
                        style={{ ...btnGold, padding: "6px 8px", fontSize: 10, whiteSpace: "nowrap" }}
                      >
                        Interesse
                      </button>
                      {p.status === "SENT" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void responder(p.id, "MORE_INFO")}
                          style={btnGhost}
                        >
                          + Info
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void responder(p.id, "DECLINED")}
                        style={{ ...btnGhost, color: "#e57373" }}
                      >
                        Recusar
                      </button>
                    </>
                  )}
                  {p.status === "INTERESTED" && (
                    <span style={{ fontSize: 10, color: DASH.gold, fontWeight: 700, whiteSpace: "nowrap" }}>
                      Aguardando agenda
                    </span>
                  )}
                  {p.status === "DECLINED" && (
                    <span style={{ fontSize: 10, color: DASH.muted, whiteSpace: "nowrap" }}>Recusada</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
