"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  COMPANY_PLAN_TIERS,
  destaquesComerciaisDoPlano,
  type CompanyPlanTier,
} from "@/lib/company-premium-plans";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { DASH, dashCard, dashPlanAccent } from "@/lib/dashboard-theme";
import styles from "./CompanyPlanCards.module.css";

interface CompanyPlanCardsProps {
  currentTier: CompanyPlanTier | null;
  onSelectFree?: () => void;
}

function primeiraFrase(texto: string): string {
  const match = texto.match(/^.*?[.!?](?:\s|$)/);
  return (match?.[0] ?? texto).trim();
}

export default function CompanyPlanCards({ currentTier, onSelectFree }: CompanyPlanCardsProps) {
  const router = useRouter();

  return (
    <section>
      <h2 style={{ ...dashPlanAccent, margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>
        Planos para Empresas
      </h2>
      <p style={{ color: DASH.muted, margin: "0 0 14px", fontSize: 12, lineHeight: 1.45 }}>
        {currentTier ? (
          <>
            Plano atual: <strong style={dashPlanAccent}>{currentTier}</strong>
            {" · "}
          </>
        ) : (
          <>Carregando plano… · </>
        )}
        Preço e o que muda em cada plano. O detalhe completo abre no próprio card.
      </p>

      <div className={styles.grid}>
        {COMPANY_PLAN_TIERS.map((plano) => {
          const isCurrent = currentTier != null && plano.id === currentTier;
          const isPaid = plano.precoCentavos > 0;
          const destaques = destaquesComerciaisDoPlano(plano);

          return (
            <div
              key={plano.id}
              data-card="1"
              className="dash-card"
              style={{
                ...dashCard,
                padding: "12px 12px 14px",
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                opacity: currentTier == null ? 0.7 : 1,
              }}
            >
              {isCurrent && (
                <span
                  style={{
                    alignSelf: "flex-start",
                    fontSize: 10,
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

              <p style={{ ...dashPlanAccent, margin: "0 0 2px", fontSize: 14, fontWeight: "bold" }}>
                {plano.emoji} {plano.nome}
              </p>
              <p style={{ color: DASH.text, margin: "0 0 6px", fontSize: 18, fontWeight: "bold", lineHeight: 1.2 }}>
                {plano.preco}
                <span style={{ fontSize: 11, fontWeight: "normal", color: DASH.muted }}>{plano.periodo}</span>
              </p>
              <p style={{ color: DASH.muted, margin: "0 0 8px", fontSize: 12, lineHeight: 1.4 }}>
                {primeiraFrase(plano.descricao)}
              </p>

              <ul
                style={{
                  margin: "0 0 10px",
                  paddingLeft: 16,
                  fontSize: 12,
                  color: DASH.text,
                  lineHeight: 1.4,
                  flex: 1,
                }}
              >
                {destaques.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              {plano.id === "FREE" && !isPaid && !isCurrent && onSelectFree && (
                <button onClick={onSelectFree} style={{ ...btnGold, padding: "8px 10px", fontSize: 12, width: "100%" }}>
                  Usar plano Free
                </button>
              )}

              {isPaid && !isCurrent && (
                <button
                  onClick={() => router.push(`/company/pagamento?plan=${plano.id}`)}
                  style={{ ...btnGold, padding: "8px 10px", fontSize: 12, width: "100%" }}
                >
                  Assinar {plano.nome}
                </button>
              )}

              {isCurrent && plano.id === "FREE" && !isPaid && (
                <p style={{ color: DASH.muted, fontSize: 12, margin: 0, textAlign: "center" }}>Plano gratuito ativo</p>
              )}

              {isCurrent && isPaid && (
                <p style={{ ...dashPlanAccent, fontSize: 12, margin: 0, textAlign: "center", fontWeight: "bold" }}>
                  Plano ativo
                </p>
              )}

              <details style={{ marginTop: 10 }}>
                <summary
                  style={{
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    color: DASH.gold,
                  }}
                >
                  Ver tudo que inclui
                </summary>
                <div style={{ marginTop: 8 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: DASH.muted, lineHeight: 1.4 }}>
                    {plano.descricao}
                  </p>
                  <ul style={{ margin: "0 0 8px", paddingLeft: 16, fontSize: 12, color: DASH.text, lineHeight: 1.4 }}>
                    {plano.inclui.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {plano.naoInclui && plano.naoInclui.length > 0 ? (
                    <ul style={{ margin: "0 0 8px", paddingLeft: 16, fontSize: 12, color: DASH.muted, lineHeight: 1.4 }}>
                      {plano.naoInclui.map((item) => (
                        <li key={item}>Não inclui: {item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {plano.limites && plano.limites.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: DASH.text, lineHeight: 1.4 }}>
                      {plano.limites.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </section>
  );
}
