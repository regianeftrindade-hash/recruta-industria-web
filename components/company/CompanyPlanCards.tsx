"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  COMPANY_PLAN_TIERS,
  type CompanyPlanTier,
} from "@/lib/company-premium-plans";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { DASH, dashCard, dashPlanAccent } from "@/lib/dashboard-theme";

interface CompanyPlanCardsProps {
  currentTier: CompanyPlanTier;
  onSelectFree?: () => void;
}

export default function CompanyPlanCards({ currentTier, onSelectFree }: CompanyPlanCardsProps) {
  const router = useRouter();

  return (
    <section>
      <h2 style={{ ...dashPlanAccent, margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>
        Planos para Empresas
      </h2>
      <p style={{ color: DASH.muted, margin: "0 0 14px", fontSize: 11 }}>
        Plano atual: <strong style={dashPlanAccent}>{currentTier}</strong>
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {COMPANY_PLAN_TIERS.map((plano) => {
          const isCurrent = plano.id === currentTier;
          const isPaid = plano.id !== "FREE";

          return (
            <div
              key={plano.id}
              style={{
                ...dashCard,
                borderRadius: 10,
                padding: "10px 10px 12px",
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
              {isCurrent && (
                <span
                  style={{
                    alignSelf: "flex-start",
                    fontSize: 8,
                    background: DASH.gold,
                    color: "#000",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontWeight: "bold",
                    border: "1px solid #000",
                    marginBottom: 6,
                  }}
                >
                  SEU PLANO
                </span>
              )}

              <p style={{ ...dashPlanAccent, margin: "0 0 2px", fontSize: 13, fontWeight: "bold" }}>
                {plano.emoji} {plano.nome}
              </p>
              <p style={{ color: DASH.text, margin: "0 0 2px", fontSize: 15, fontWeight: "bold", lineHeight: 1.2 }}>
                {plano.preco}
                <span style={{ fontSize: 9, fontWeight: "normal", color: DASH.muted }}>{plano.periodo}</span>
              </p>
              <p style={{ color: DASH.muted, margin: "0 0 8px", fontSize: 9, lineHeight: 1.35 }}>
                {plano.descricao}
              </p>

              <p style={{ ...dashPlanAccent, margin: "0 0 4px", fontSize: 9, fontWeight: "bold" }}>Inclui</p>
              <ul
                style={{
                  margin: "0 0 8px",
                  paddingLeft: 14,
                  fontSize: 8.5,
                  color: DASH.text,
                  lineHeight: 1.4,
                  flex: 1,
                }}
              >
                {plano.inclui.map((item) => (
                  <li key={item}>✅ {item}</li>
                ))}
              </ul>

              {plano.naoInclui && plano.naoInclui.length > 0 && (
                <>
                  <p style={{ ...dashPlanAccent, margin: "0 0 4px", fontSize: 9, fontWeight: "bold" }}>Não inclui</p>
                  <ul style={{ margin: "0 0 8px", paddingLeft: 14, fontSize: 8.5, color: DASH.muted, lineHeight: 1.4 }}>
                    {plano.naoInclui.map((item) => (
                      <li key={item}>❌ {item}</li>
                    ))}
                  </ul>
                </>
              )}

              {plano.limites && plano.limites.length > 0 && (
                <>
                  <p style={{ ...dashPlanAccent, margin: "0 0 4px", fontSize: 9, fontWeight: "bold" }}>Limites</p>
                  <ul style={{ margin: "0 0 10px", paddingLeft: 14, fontSize: 8.5, color: DASH.text, lineHeight: 1.4 }}>
                    {plano.limites.map((item) => (
                      <li key={item}>⚠️ {item}</li>
                    ))}
                  </ul>
                </>
              )}

              {plano.id === "FREE" && !isCurrent && onSelectFree && (
                <button onClick={onSelectFree} style={{ ...btnGold, padding: "7px 8px", fontSize: 9, width: "100%" }}>
                  Usar plano Free
                </button>
              )}

              {isPaid && !isCurrent && (
                <button
                  onClick={() => router.push(`/company/pagamento?plan=${plano.id}`)}
                  style={{ ...btnGold, padding: "7px 8px", fontSize: 9, width: "100%" }}
                >
                  Assinar {plano.nome}
                </button>
              )}

              {isCurrent && plano.id === "FREE" && (
                <p style={{ color: DASH.muted, fontSize: 9, margin: 0, textAlign: "center" }}>Plano gratuito ativo</p>
              )}

              {isCurrent && isPaid && (
                <p style={{ ...dashPlanAccent, fontSize: 9, margin: 0, textAlign: "center", fontWeight: "bold" }}>
                  ✓ Plano ativo
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
