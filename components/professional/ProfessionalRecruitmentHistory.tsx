"use client";

import React from "react";
import { DASH, dashCard, dashSectionTitle } from "@/lib/dashboard-theme";

export type RecruitmentHistoryCounts = {
  propostas: number;
  entrevistas: number;
  testes: number;
  contratacoes: number;
  naoContratacoes: number;
};

type Props = {
  history: RecruitmentHistoryCounts;
};

const STEPS: Array<{ key: keyof RecruitmentHistoryCounts; label: string }> = [
  { key: "propostas", label: "Propostas" },
  { key: "entrevistas", label: "Entrevistas" },
  { key: "testes", label: "Testes" },
  { key: "contratacoes", label: "Contratação" },
  { key: "naoContratacoes", label: "Não contratações" },
];

export default function ProfessionalRecruitmentHistory({ history }: Props) {
  return (
    <section className="dash-card" style={{ ...dashCard, padding: 14, boxShadow: DASH.shadow }}>
      <h3 style={{ ...dashSectionTitle, color: DASH.gold, margin: "0 0 12px", fontSize: 14 }}>
        📈 Histórico
      </h3>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 0,
          width: "100%",
          overflowX: "auto",
        }}
      >
        {STEPS.map((step, index) => {
          const count = history[step.key] || 0;
          const active = count > 0;
          return (
            <React.Fragment key={step.key}>
              {index > 0 && (
                <div
                  style={{
                    flex: "0 0 12px",
                    alignSelf: "center",
                    height: 2,
                    background: active ? DASH.gold : DASH.border,
                    opacity: active ? 0.85 : 0.5,
                    marginTop: -14,
                  }}
                />
              )}
              <div
                style={{
                  flex: "1 1 0",
                  minWidth: 64,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    border: `2px solid ${active ? DASH.gold : DASH.border}`,
                    background: active ? "rgba(200,155,60,0.18)" : DASH.inner,
                    color: active ? DASH.gold : DASH.muted,
                  }}
                >
                  {count}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    color: active ? DASH.text : DASH.muted,
                    lineHeight: 1.25,
                  }}
                >
                  {step.label}
                </p>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
