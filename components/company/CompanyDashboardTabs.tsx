"use client";
import { formatUiDate, uiIntlLocale } from "@/lib/i18n/format-ui";
import { exactUi } from "@/lib/i18n/exact-ui";

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
import FotoPerfilAvatar from "@/components/shared/FotoPerfilAvatar";
import { t } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

export type CompanyDashboardTabId =
  | "vagas"
  | "entrevistas"
  | "equipe"
  | "banco"
  | "alertas"
  | "contato"
  | "meu-plano"
  | "perfil";

export type TalentListDetalhada = TalentList & {
  profiles: Array<{ id: string; nome: string; cargo: string; avatar?: string | null }>;
};

export type AlertMatch = {
  profileId: string;
  score: number;
  nome?: string;
  cargo?: string;
  avatar?: string | null;
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
  labelKey: MessageKey;
  href: string;
}> = [
  { id: "vagas", label: "Publicar vagas", labelKey: "surface.dash.company.jobs", href: BASE },
  { id: "inicio", label: "Caça Talentos", labelKey: "surface.dash.company.search", href: `${BASE}?tab=inicio` },
  { id: "entrevistas", label: "Entrevistas", labelKey: "surface.dash.company.interviews", href: `${BASE}/entrevistas` },
  { id: "equipe", label: "Equipe", labelKey: "surface.dash.company.team", href: `${BASE}/equipe` },
  { id: "banco", label: "Banco", labelKey: "surface.dash.company.bank", href: `${BASE}/banco` },
  { id: "alertas", label: "Alertas", labelKey: "surface.dash.company.alerts", href: `${BASE}/alertas` },
  { id: "contato", label: "Contato Recruta", labelKey: "surface.dash.company.contact", href: `${BASE}/contato` },
  { id: "perfil", label: "Perfil", labelKey: "surface.dash.company.profile", href: `${BASE}?tab=perfil` },
  { id: "meu-plano", label: "Meu Plano", labelKey: "surface.dash.company.plan", href: `${BASE}/meu-plano` },
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
      aria-label={t("fix.aria.dashboardPages")}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        alignItems: "flex-end",
        justifyContent: "flex-end",
        width: "100%",
        paddingTop: 10,
        borderBottom: "2px solid #8D6B1F",
        marginBottom: 0,
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
            role="tab"
            aria-selected={ativo}
            onClick={() => setActiveTab(tabId)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "8px 16px",
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: "0.02em",
              textDecoration: "none",
              whiteSpace: "nowrap",
              color: "#000",
              background: ativo ? "#E8C56A" : "#F3E6C8",
              border: "2px solid #8D6B1F",
              borderBottom: ativo ? "2px solid var(--dash-bg)" : "2px solid #8D6B1F",
              borderRadius: "14px 14px 0 0",
              marginBottom: -2,
              position: "relative",
              zIndex: 1,
              boxShadow: "none",
              cursor: "pointer",
              lineHeight: 1.2,
              fontFamily: "inherit",
            }}
          >
            <span>{t(tab.labelKey)}</span>
            {typeof badge === "number" && badge > 0 ? (
              <span
                style={{
                  background: "#8D6B1F",
                  color: "#F3E6C8",
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
  const porCargo = new Map<string, Array<{ id: string; nome: string; avatar: string | null; listas: string[] }>>();
  for (const lista of talentListsDetalhadas) {
    for (const p of lista.profiles) {
      const grupo = porCargo.get(p.cargo) || [];
      const existente = grupo.find((g) => g.id === p.id);
      if (existente) {
        if (!existente.listas.includes(lista.name)) existente.listas.push(lista.name);
      } else {
        grupo.push({ id: p.id, nome: p.nome, avatar: p.avatar || null, listas: [lista.name] });
      }
      porCargo.set(p.cargo, grupo);
    }
  }
  const cargosOrdenados = [...porCargo.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));

  const titulo = (() => {
    const atual = COMPANY_DASH_TABS.find((item) => item.id === tab);
    return atual ? t(atual.labelKey) : "";
  })();

  let conteudo: React.ReactNode = null;

  if (tab === "banco") {
    conteudo = !canUseTalentBank ? (
      <UpgradeNote texto={exactUi("Banco de talentos disponível a partir do plano Premium.")} />
    ) : (
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: DASH.muted, fontWeight: 700, textTransform: "uppercase" }}>{exactUi("Listas:")}</span>
          {talentListsDetalhadas.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onOpenList(l)}
              title={exactUi("Abrir os perfis desta lista na vitrine")}
              style={{
                background: "transparent",
                border: `2px solid #8D6B1F`,
                color: "#000",
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
          <button type="button" onClick={onCreateList} style={{ ...btnGold, padding: "5px 12px", fontSize: 11, color: "#000" }}>{exactUi("+ Lista")}</button>
        </div>

        {cargosOrdenados.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>{exactUi("Nenhum profissional guardado ainda. Abra um perfil na vitrine e adicione ao banco de talentos.")}</p>
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
                      title={exactUi("Abrir perfil")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        borderBottom: `1px solid ${DASH.border}`,
                        color: "#000",
                        fontSize: 12,
                        padding: "6px 2px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <FotoPerfilAvatar value={p.avatar} size={32} />
                      <span>
                      <strong>{p.nome}</strong>
                      <span style={{ display: "block", fontSize: 10, color: DASH.muted, marginTop: 2 }}>
                        {p.listas.map((nome) => `📁 ${nome}`).join(" · ")}
                      </span>
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
          {t("surface.dash.company.interviewsEmpty")}
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {entrevistas.map((ev) => {
            const when = new Date(ev.scheduledAt);
            const dataLabel = formatUiDate(when, { day: "2-digit", month: "short", year: "numeric" });
            const horaLabel = when.toLocaleTimeString(uiIntlLocale(), { hour: "2-digit", minute: "2-digit" });
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
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 11,
                    fontWeight: 800,
                    color: ev.interviewStatus === "CONFIRMED" ? "#8bc34a" : DASH.muted,
                  }}
                >
                  {ev.interviewStatus === "CONFIRMED"
                    ? exactUi("✓ Confirmada pelo profissional")
                    : exactUi("Aguardando confirmação")}{" "}
                  · clique para abrir o perfil
                </p>
              </button>
            );
          })}
        </div>
      );
  } else if (tab === "alertas") {
    conteudo = !canUseAlerts ? (
      <UpgradeNote texto={exactUi("Alertas de vagas disponíveis a partir do plano Premium.")} />
    ) : (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontSize: 11, color: DASH.muted, lineHeight: 1.5 }}>{exactUi("Defina filtros de busca e crie um alerta. Sempre que um perfil compatível aparecer, ele é listado aqui.")}</p>
          <button type="button" onClick={onCreateAlert} style={{ ...btnGold, padding: "6px 12px", fontSize: 11 }}>{exactUi("+ Novo alerta")}</button>
        </div>
        {alerts.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>{exactUi("Nenhum alerta configurado.")}</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {alerts.map((a) => (
              <div key={a.id} style={{ ...dashInnerBox, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <strong style={{ color: "#000", fontSize: 13 }}>🔔 {a.name}</strong>
                  <label style={{ color: DASH.muted, fontSize: 10, whiteSpace: "nowrap" }}>
                    <input type="checkbox" checked={a.active} onChange={(e) => onToggleAlert(a.id, e.target.checked)} />{exactUi("Ativo")}</label>
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
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
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
                        <FotoPerfilAvatar value={m.avatar} size={28} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                        <strong>{m.nome || exactUi("Profissional")}</strong>
                        <span style={{ color: DASH.muted }}> · {m.cargo || ""}</span>
                        <span style={{ float: "right", color: DASH.gold, fontWeight: 700 }}>🎯 {m.score}%</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: "0 0 8px", fontSize: 11, color: DASH.muted }}>{exactUi("Nenhum perfil novo compatível nos últimos 30 dias.")}</p>
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
                  >{exactUi("Abrir na vitrine")}</button>
                  <button
                    type="button"
                    onClick={() => onDeleteAlert(a.id)}
                    style={{ background: "none", border: "none", color: "#f87171", fontSize: 11, cursor: "pointer", padding: 0 }}
                  >{exactUi("Excluir")}</button>
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
      <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>{exactUi("Abra a aba Meu Plano pelo menu superior.")}</p>
    );
  }

  return (
    <section className="dash-card" style={{ ...dashCard, padding: 16 }}>
      <h3 style={{ ...dashSectionTitle, margin: "0 0 12px", fontSize: 15 }}>{titulo}</h3>
      {conteudo}
    </section>
  );
}
