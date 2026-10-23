"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { DASH, dashCard, dashPlanAccent, dashSectionTitle } from "@/lib/dashboard-theme";
import { professionalPlanCompare } from "@/lib/professional/professional-plan-compare";
import { professionalAccessState, type ProfessionalAccessState } from "@/lib/professional/subscription-state";

type SubscriptionSnapshot = {
  isPremium: boolean;
  subscriptionExpiresAt: string | null;
  latestCharge: { status: string; reference: string; createdAt: string } | null;
};

const { free, premium, rows } = professionalPlanCompare();

function situacaoTexto(estado: ProfessionalAccessState, expiresAt: string | null): string {
  if (estado === "active") {
    const ate = expiresAt ? ` até ${new Date(expiresAt).toLocaleDateString("pt-BR")}` : "";
    return `Premium ativo${ate}.`;
  }
  if (estado === "pending") {
    return "Pagamento pendente. O Premium só é ativado depois da confirmação.";
  }
  if (estado === "declined" || estado === "canceled") {
    return "O pagamento não foi concluído. O plano continua gratuito.";
  }
  return "Plano gratuito ativo.";
}

function botaoPagamento(estado: ProfessionalAccessState): string | null {
  if (estado === "active") return null;
  if (estado === "pending") return "Continuar pagamento";
  return "Pagar e assinar Premium";
}

export default function ProfessionalMeuPlano({
  initialSnapshot,
}: {
  initialSnapshot?: SubscriptionSnapshot | null;
} = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(initialSnapshot === undefined);
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot | null>(initialSnapshot ?? null);

  useEffect(() => {
    if (initialSnapshot !== undefined) return;
    let ativo = true;
    void fetch("/api/professional/subscription", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ativo) return;
        setSnapshot(
          data
            ? {
                isPremium: Boolean(data.isPremium),
                subscriptionExpiresAt: data.subscriptionExpiresAt ?? null,
                latestCharge: data.latestCharge ?? null,
              }
            : { isPremium: false, subscriptionExpiresAt: null, latestCharge: null },
        );
      })
      .catch(() => {
        if (!ativo) return;
        setSnapshot({ isPremium: false, subscriptionExpiresAt: null, latestCharge: null });
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, [initialSnapshot]);

  const estado = professionalAccessState({
    isPremium: Boolean(snapshot?.isPremium),
    latestChargeStatus: snapshot?.latestCharge?.status,
  });
  const planoAtual = snapshot?.isPremium ? premium : free;
  const textoBotao = botaoPagamento(estado);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
      <section className="dash-card" style={{ ...dashCard, padding: 16 }}>
        <h2 style={{ ...dashSectionTitle, margin: "0 0 8px", fontSize: 15 }}>Meu plano</h2>
        {loading || !snapshot ? (
          <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>Carregando plano...</p>
        ) : (
          <>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: DASH.gold }}>
              {planoAtual.emoji} Plano atual: {planoAtual.nome}
            </p>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: DASH.text }}>
              {planoAtual.preco}
              <span style={{ color: DASH.muted, fontSize: 11 }}>{planoAtual.periodo}</span>
            </p>
            <p style={{ margin: 0, fontSize: 12, color: DASH.muted, lineHeight: 1.5 }}>
              {situacaoTexto(estado, snapshot.subscriptionExpiresAt)}
            </p>
          </>
        )}
      </section>

      <section className="dash-card" style={{ ...dashCard, padding: 16 }}>
        <h2 style={{ ...dashPlanAccent, margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>
          Planos para Profissionais
        </h2>
        <p style={{ color: DASH.muted, margin: "0 0 14px", fontSize: 12, lineHeight: 1.45 }}>
          Compare o gratuito e o Premium. A contratação e o pagamento ficam no botão abaixo.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {[free, premium].map((plano) => {
            const atual = !loading && snapshot != null && plano.id === planoAtual.id;
            return (
              <div
                key={plano.id}
                className="dash-card"
                style={{ ...dashCard, padding: 14, display: "flex", flexDirection: "column", minWidth: 0 }}
              >
                {atual ? (
                  <span
                    style={{
                      alignSelf: "flex-start",
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
                <p style={{ ...dashPlanAccent, margin: "0 0 2px", fontSize: 14, fontWeight: 800 }}>
                  {plano.emoji} {plano.nome}
                </p>
                <p style={{ color: DASH.text, margin: "0 0 4px", fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
                  {plano.preco}
                  <span style={{ fontSize: 11, fontWeight: 500, color: DASH.muted }}>{plano.periodo}</span>
                </p>
                <p style={{ color: DASH.muted, margin: "0 0 10px", fontSize: 12, lineHeight: 1.4 }}>{plano.descricao}</p>
                <p style={{ ...dashPlanAccent, margin: "0 0 4px", fontSize: 11, fontWeight: 800 }}>Inclui</p>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: DASH.text, lineHeight: 1.45, flex: 1 }}>
                  {plano.inclui.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  {plano.id === "PREMIUM" ? <li>Vagas compatíveis com o seu perfil</li> : null}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="dash-card" style={{ ...dashCard, padding: 16 }}>
        <h2 style={{ ...dashSectionTitle, margin: "0 0 10px", fontSize: 15 }}>Comparação</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, color: DASH.text }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #8D6B1F" }}>Funcionalidade</th>
                <th style={{ textAlign: "center", padding: "8px 6px", borderBottom: "1px solid #8D6B1F", width: 90 }}>Gratuito</th>
                <th style={{ textAlign: "center", padding: "8px 6px", borderBottom: "1px solid #8D6B1F", width: 90 }}>Premium</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.item}>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid rgba(141,107,31,0.25)", lineHeight: 1.4 }}>{row.item}</td>
                  <td style={{ textAlign: "center", padding: "8px 6px", borderBottom: "1px solid rgba(141,107,31,0.25)" }}>
                    {row.free ? "Sim" : "Não"}
                  </td>
                  <td style={{ textAlign: "center", padding: "8px 6px", borderBottom: "1px solid rgba(141,107,31,0.25)", fontWeight: 700 }}>
                    {row.premium ? "Sim" : "Não"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dash-card" style={{ ...dashCard, padding: 16 }}>
        <h2 style={{ ...dashSectionTitle, margin: "0 0 8px", fontSize: 15 }}>Contratação</h2>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: DASH.text, lineHeight: 1.5 }}>
          O Premium custa {premium.preco}
          {premium.periodo}. O pagamento é em Pix ou boleto. O plano só fica ativo depois que o pagamento é confirmado.
        </p>
        {!loading && snapshot && textoBotao ? (
          <button
            type="button"
            onClick={() => router.push("/professional/pagamento")}
            style={{ ...btnGold, padding: "10px 16px", fontSize: 13 }}
          >
            {textoBotao}
          </button>
        ) : null}
        {!loading && snapshot && !textoBotao ? (
          <p style={{ ...dashPlanAccent, margin: 0, fontSize: 13, fontWeight: 800 }}>Plano ativo</p>
        ) : null}
      </section>
    </div>
  );
}
