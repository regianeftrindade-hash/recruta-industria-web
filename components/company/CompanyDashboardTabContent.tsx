"use client";

import React, { useEffect, useState } from "react";
import { useCompanyDashboardTab, type CompanyDashboardActiveTab } from "@/components/company/CompanyDashboardTabContext";
import type { CompanyDashboardTabId } from "@/components/company/CompanyDashboardTabs";
import CompanyDashboardSectionPage from "@/components/company/CompanyDashboardSectionPage";
import CompanyDashboardInicioPage from "@/components/company/CompanyDashboardInicioPage";
import CompanyTeamPage from "@/components/company/CompanyTeamPage";
import CompanyMeuPlanoPage from "@/components/company/CompanyMeuPlanoPage";
import CompanyProfileAside from "@/components/company/CompanyProfileAside";
import CompanyVagasPanel from "@/components/company/CompanyVagasPanel";

const SECTION_TABS: CompanyDashboardTabId[] = ["entrevistas", "banco", "alertas", "contato"];

/**
 * Layout fixo: perfil da empresa à esquerda; abas trocam só o painel direito
 * (como o dashboard profissional: perfil lateral + conteúdo da aba).
 */
export default function CompanyDashboardTabContent() {
  const { activeTab } = useCompanyDashboardTab();
  const [visited, setVisited] = useState<Set<CompanyDashboardActiveTab>>(() => new Set([activeTab]));

  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  const panelStyle = (tab: CompanyDashboardActiveTab): React.CSSProperties => ({
    display: activeTab === tab ? "block" : "none",
  });

  return (
    <div
      className="ri-company-dash-grid"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: "calc(100vh - 90px)",
      }}
    >
      {activeTab === "vagas" ? <CompanyProfileAside compact /> : null}
      {activeTab === "perfil" ? <CompanyProfileAside /> : null}

      <div data-company-main style={{ overflowY: "auto", minWidth: 0, display: activeTab === "perfil" ? "none" : "flex", flexDirection: "column", gap: 12 }}>
        {visited.has("vagas") ? (
          <div style={panelStyle("vagas")}>
            <CompanyVagasPanel />
          </div>
        ) : null}
        {visited.has("inicio") ? (
          <div style={panelStyle("inicio")}>
            <CompanyDashboardInicioPage />
          </div>
        ) : null}
        {visited.has("equipe") ? (
          <div style={panelStyle("equipe")}>
            <CompanyTeamPage />
          </div>
        ) : null}
        {visited.has("meu-plano") ? (
          <div style={panelStyle("meu-plano")}>
            <CompanyMeuPlanoPage />
          </div>
        ) : null}
        {SECTION_TABS.map((tab) =>
          visited.has(tab) ? (
            <div key={tab} style={panelStyle(tab)}>
              <CompanyDashboardSectionPage tab={tab} />
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
