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
  currentTier: CompanyPlanTier | null;
  onSelectFree?: () => void;
}

export default function CompanyPlanCards({ currentTier, onSelectFree }: CompanyPlanCardsProps) {
  const router = useRouter();

  return (
    <section>
      <h2 style={{ ...dashPlanAccent, margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>
        Planos para Empresas
      </h2>
      <p style={{ color: DASH.muted, margin: "0 0 14px", fontSize: 13, lineHeight: 1.5 }}>
        {currentTier ? (
          <>
            Plano atual: <strong style={{ color: DASH.text }}>{currentTier}</strong>.{" "}
          </>
        ) : (
          <>Carregando plano. </>
        )}
        Nos planos pagos, o desconto de lançamento de 20% vale nos três primeiros pagamentos mensais.
        Depois disso, cobra o preço normal. O plano anual não entra nesse desconto.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {COMPANY_PLAN_TIERS.map((plano) => {
          const isCurrent = currentTier != null && plano.id === currentTier;
          const isPaid = plano.precoCentavos > 0;

          return (
            <article
              key={plano.id}
              className="dash-card"
              style={{
                ...dashCard,
                padding: 16,
                opacity: currentTier == null ? 0.75 : 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div style={{ minWidth: 0, flex: "1 1 220px" }}>
                  {isCurrent ? (
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 10,
                        background: DASH.gold,
                        color: "#000",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontWeight: 800,
                        marginBottom: 8,
                      }}
                    >
                      SEU PLANO
                    </span>
                  ) : null}
                  <p style={{ ...dashPlanAccent, margin: "0 0 2px", fontSize: 16, fontWeight: 800 }}>
                    {plano.emoji} {plano.nome}
                  </p>
                  <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: DASH.text }}>{plano.subtitulo}</p>
                  <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: DASH.text, lineHeight: 1.15 }}>
                    {plano.preco}
                    <span style={{ fontSize: 13, fontWeight: 600, color: DASH.muted }}>{plano.periodo}</span>
                  </p>
                  {plano.precoLancamento ? (
                    <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: DASH.text }}>
                      Lançamento: {plano.precoLancamento}/mês nos 3 primeiros meses
                    </p>
                  ) : null}
                  <p style={{ margin: 0, fontSize: 13, color: DASH.muted, lineHeight: 1.45 }}>{plano.descricao}</p>
                </div>

                <div style={{ flex: "0 0 auto", minWidth: 160 }}>
                  {plano.id === "FREE" && !isPaid && !isCurrent && onSelectFree ? (
                    <button type="button" onClick={onSelectFree} style={{ ...btnGold, padding: "10px 14px", fontSize: 12, width: "100%" }}>
                      Usar plano Free
                    </button>
                  ) : null}
                  {isPaid && !isCurrent ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/company/pagamento?plan=${plano.id}`)}
                      style={{ ...btnGold, padding: "10px 14px", fontSize: 12, width: "100%" }}
                    >
                      Assinar {plano.nome}
                    </button>
                  ) : null}
                  {isCurrent && plano.id === "FREE" && !isPaid ? (
                    <p style={{ color: DASH.muted, fontSize: 12, margin: 0 }}>Plano gratuito ativo</p>
                  ) : null}
                  {isCurrent && isPaid ? (
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: DASH.text }}>Plano ativo</p>
                  ) : null}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 12,
                }}
              >
                {plano.secoes.map((secao) => (
                  <div key={secao.titulo}>
                    <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 800, color: DASH.text }}>{secao.titulo}</p>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: DASH.text, lineHeight: 1.45 }}>
                      {secao.itens.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className="dash-card" style={{ ...dashCard, padding: 14, marginTop: 14 }}>
        <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 800, color: DASH.text }}>Como a contratação funciona</p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: DASH.text, lineHeight: 1.5 }}>
          <li>O desconto de lançamento vale só nos três primeiros pagamentos mensais. O anual usa o preço normal, com os dois meses já previstos nesse ciclo.</li>
          <li>A quantidade sugerida de vagas ativas ainda não trava a publicação.</li>
          <li>Cada anúncio segue o destino configurado: candidatura na plataforma, site da empresa, e-mail ou WhatsApp.</li>
          <li>O selo de empresa verificada depende da aprovação do cartão CNPJ e do e-mail corporativo. Ele não entra junto com o plano.</li>
        </ul>
      </div>
    </section>
  );
}
