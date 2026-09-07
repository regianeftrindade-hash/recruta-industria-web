"use client";

import React from "react";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import {
  DASH,
  dashCard,
  dashInnerBox,
  dashPlanAccent,
  dashSectionTitle,
} from "@/lib/dashboard-theme";
import { CompanyRecrutaContactBox } from "@/components/company/CompanyRecrutaContactBox";
import type { CompanyAlert, TalentList } from "@/components/company/CompanyDashboardTools";
import {
  useCompanyDashboardTab,
  type CompanyDashboardActiveTab,
} from "@/components/company/CompanyDashboardTabContext";

export type CompanyDashboardTabId =
  | "entrevistas"
  | "equipe"
  | "banco"
  | "alertas"
  | "contato"
  | "meu-plano";

export type TalentListDetalhada = TalentList & {
  profiles: Array<{ id: string; nome: string; cargo: string }>;
};

export type AlertMatch = {
  profileId: string;
  score: number;
  nome?: string;
  cargo?: string;
};

export type EntrevistaAgendada = {
  proposalId: string;
  profileId: string;
  professionalName: string;
  cargo: string;
  scheduledAt: string;
  interviewStatus: string;
};

const BASE = "/company/dashboard-empresa";

export const COMPANY_DASH_TABS: Array<{
  id: CompanyDashboardTabId | "inicio";
  label: string;
  href: string;
}> = [
  { id: "inicio", label: "Caça Talentos", href: BASE },
  { id: "entrevistas", label: "Entrevistas", href: `${BASE}/entrevistas` },
  { id: "equipe", label: "Equipe", href: `${BASE}/equipe` },
  { id: "banco", label: "Banco", href: `${BASE}/banco` },
  { id: "alertas", label: "Alertas", href: `${BASE}/alertas` },
  { id: "contato", label: "Contato Recruta", href: `${BASE}/contato` },
  { id: "meu-plano", label: "Meu Plano", href: `${BASE}/meu-plano` },
];

function UpgradeNote({ texto }: { texto: string }) {
  return (
    <p style={{ margin: 0, fontSize: 12, color: DASH.muted, ...dashCard, padding: 14, borderRadius: 16 }}>
      🔒 {texto}
    </p>
  );
}

/**
 * Abas pequenas com borda dourada no fundo escuro.
 * Troca o conteúdo na mesma tela (sem navegar para outra página).
 */
export function CompanyDashboardNav({
  badges,
}: {
  badges?: Partial<Record<CompanyDashboardTabId, number>>;
}) {
  const { activeTab, setActiveTab } = useCompanyDashboardTab();

  return (
    <nav
      aria-label="Páginas do dashboard"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        alignItems: "center",
        justifyContent: "flex-end",
        paddingTop: 2,
      }}
    >
      {COMPANY_DASH_TABS.map((tab) => {
        const tabId = tab.id as CompanyDashboardActiveTab;
        const ativo = activeTab === tabId;
        const badge = tab.id !== "inicio" ? badges?.[tab.id] : undefined;

        return (
          <button
            key={tab.id}
            type="button"
            aria-current={ativo ? "page" : undefined}
            onClick={() => setActiveTab(tabId)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "5px 12px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.02em",
              textDecoration: "none",
              whiteSpace: "nowrap",
              color: ativo ? "#000" : DASH.gold,
              background: ativo ? DASH.gold : "transparent",
              border: `1px solid ${DASH.gold}`,
              borderRadius: "10px 10px 0 0",
              boxShadow: ativo ? "0 2px 0 #5a4512" : "none",
              cursor: "pointer",
              lineHeight: 1.2,
              fontFamily: "inherit",
            }}
          >
            <span>{tab.label}</span>
            {typeof badge === "number" && badge > 0 ? (
              <span
                style={{
                  background: ativo ? "#000" : DASH.gold,
                  color: ativo ? DASH.gold : "#000",
                  borderRadius: 999,
                  fontSize: 9,
                  fontWeight: 800,
                  padding: "1px 6px",
                  lineHeight: 1.2,
                }}
              >
                {badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

/** Compat: sem fundo branco — só envolve o conteúdo no tema escuro. */
export function CompanyDashboardSheet({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** Conteúdo de uma aba (usado nas páginas separadas). */
export default function CompanyDashboardTabPanel({
  tab,
  canUseTalentBank,
  talentListsDetalhadas,
  onCreateList,
  onOpenList,
  onOpenProfile,
  entrevistas,
  canUseAlerts,
  alerts,
  onCreateAlert,
  onToggleAlert,
  onDeleteAlert,
  onOpenAlertMatches,
  canContactRecruta,
}: {
  tab: CompanyDashboardTabId;
  canUseTalentBank: boolean;
  talentListsDetalhadas: TalentListDetalhada[];
  onCreateList: () => void;
  onOpenList: (list: TalentList) => void;
  onOpenProfile: (profileId: string) => void;
  entrevistas: EntrevistaAgendada[];
  canUseAlerts: boolean;
  alerts: Array<Omit<CompanyAlert, "newMatches"> & { newMatches: AlertMatch[] }>;
  onCreateAlert: () => void;
  onToggleAlert: (id: string, active: boolean) => void;
  onDeleteAlert: (id: string) => void;
  onOpenAlertMatches: (alert: CompanyAlert) => void;
  canContactRecruta: boolean;
}) {
  const porCargo = new Map<string, Array<{ id: string; nome: string; listas: string[] }>>();
  for (const lista of talentListsDetalhadas) {
    for (const p of lista.profiles) {
      const grupo = porCargo.get(p.cargo) || [];
      const existente = grupo.find((g) => g.id === p.id);
      if (existente) {
        if (!existente.listas.includes(lista.name)) existente.listas.push(lista.name);
      } else {
        grupo.push({ id: p.id, nome: p.nome, listas: [lista.name] });
      }
      porCargo.set(p.cargo, grupo);
    }
  }
  const cargosOrdenados = [...porCargo.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));

  const titulo = COMPANY_DASH_TABS.find((t) => t.id === tab)?.label || "";

  let conteudo: React.ReactNode = null;

  if (tab === "banco") {
    conteudo = !canUseTalentBank ? (
      <UpgradeNote texto="Banco de talentos disponível a partir do plano Premium." />
    ) : (
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: DASH.muted, fontWeight: 700, textTransform: "uppercase" }}>
            Listas:
          </span>
          {talentListsDetalhadas.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onOpenList(l)}
              title="Abrir os perfis desta lista na vitrine"
              style={{
                background: "transparent",
                border: `1px solid ${DASH.gold}`,
                color: DASH.gold,
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {l.name} ({l.itemCount})
            </button>
          ))}
          <button type="button" onClick={onCreateList} style={{ ...btnGold, padding: "5px 12px", fontSize: 11 }}>
            + Lista
          </button>
        </div>

        {cargosOrdenados.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>
            Nenhum profissional guardado ainda. Abra um perfil na vitrine e adicione ao banco de talentos.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {cargosOrdenados.map((cargo) => {
              const perfis = porCargo.get(cargo) || [];
              return (
                <div key={cargo} style={{ ...dashInnerBox, padding: 12 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 800, color: DASH.gold, textTransform: "uppercase" }}>
                    🛠️ {cargo} <span style={{ color: DASH.muted, fontWeight: 600 }}>({perfis.length})</span>
                  </p>
                  {perfis.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onOpenProfile(p.id)}
                      title="Abrir perfil"
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        borderBottom: `1px solid ${DASH.border}`,
                        color: DASH.text,
                        fontSize: 12,
                        padding: "6px 2px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      👤 <strong>{p.nome}</strong>
                      <span style={{ display: "block", fontSize: 10, color: DASH.muted, marginTop: 2 }}>
                        {p.listas.map((nome) => `📁 ${nome}`).join(" · ")}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  } else if (tab === "entrevistas") {
    conteudo =
      entrevistas.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>
          Quando você agendar entrevistas a partir de propostas, elas aparecerão aqui.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {entrevistas.map((ev) => {
            const when = new Date(ev.scheduledAt);
            const dataLabel = when.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
            const horaLabel = when.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            return (
              <button
                key={ev.proposalId}
                type="button"
                onClick={() => onOpenProfile(ev.profileId)}
                style={{
                  ...dashInnerBox,
                  padding: 14,
                  textAlign: "left",
                  cursor: "pointer",
                  color: DASH.text,
                  fontFamily: "inherit",
                }}
              >
                <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: DASH.text }}>
                  {ev.professionalName}
                </p>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: DASH.muted }}>{ev.cargo}</p>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: DASH.gold }}>
                  {dataLabel} · {horaLabel}
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 10, color: DASH.muted }}>
                  {ev.interviewStatus === "CONFIRMED" ? "Confirmada" : "Aguardando confirmação"} · clique para abrir o perfil
                </p>
              </button>
            );
          })}
        </div>
      );
  } else if (tab === "alertas") {
    conteudo = !canUseAlerts ? (
      <UpgradeNote texto="Alertas de vagas disponíveis a partir do plano Premium." />
    ) : (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontSize: 11, color: DASH.muted, lineHeight: 1.5 }}>
            Defina filtros de busca e crie um alerta. Sempre que um perfil compatível aparecer, ele é listado aqui.
          </p>
          <button type="button" onClick={onCreateAlert} style={{ ...btnGold, padding: "6px 12px", fontSize: 11 }}>
            + Novo alerta
          </button>
        </div>
        {alerts.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>Nenhum alerta configurado.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {alerts.map((a) => (
              <div key={a.id} style={{ ...dashInnerBox, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <strong style={{ color: DASH.gold, fontSize: 13 }}>🔔 {a.name}</strong>
                  <label style={{ color: DASH.muted, fontSize: 10, whiteSpace: "nowrap" }}>
                    <input type="checkbox" checked={a.active} onChange={(e) => onToggleAlert(a.id, e.target.checked)} /> Ativo
                  </label>
                </div>

                {a.newMatches.length > 0 ? (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: DASH.muted, textTransform: "uppercase" }}>
                      Perfis compatíveis ({a.newMatches.length})
                    </p>
                    {a.newMatches.map((m) => (
                      <button
                        key={m.profileId}
                        type="button"
                        onClick={() => onOpenProfile(m.profileId)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          background: "transparent",
                          border: "none",
                          borderBottom: `1px solid ${DASH.border}`,
                          color: DASH.text,
                          fontSize: 11,
                          padding: "5px 2px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        👤 <strong>{m.nome || "Profissional"}</strong>
                        <span style={{ color: DASH.muted }}> · {m.cargo || ""}</span>
                        <span style={{ float: "right", color: DASH.gold, fontWeight: 700 }}>🎯 {m.score}%</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: "0 0 8px", fontSize: 11, color: DASH.muted }}>
                    Nenhum perfil novo compatível nos últimos 30 dias.
                  </p>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => onOpenAlertMatches(a)}
                    style={{
                      ...dashPlanAccent,
                      padding: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Abrir na vitrine
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAlert(a.id)}
                    style={{ background: "none", border: "none", color: "#f87171", fontSize: 11, cursor: "pointer", padding: 0 }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } else if (tab === "contato") {
    conteudo = (
      <div style={{ maxWidth: 480 }}>
        <CompanyRecrutaContactBox unlocked={canContactRecruta} />
      </div>
    );
  } else if (tab === "meu-plano") {
    conteudo = (
      <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>
        Abra a aba Meu Plano pelo menu superior.
      </p>
    );
  }

  return (
    <section className="dash-card" style={{ ...dashCard, padding: 16 }}>
      <h3 style={{ ...dashSectionTitle, margin: "0 0 12px", fontSize: 15 }}>{titulo}</h3>
      {conteudo}
    </section>
  );
}
