"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import { matchesCompanyTestBypass } from "@/lib/company/company-test-bypass-shared";
import { DASH } from "@/lib/dashboard-theme";
import type { CompanyAlert, TalentList } from "@/app/components/CompanyDashboardTools";
import CompanyDashboardTabPanel, {
  type CompanyDashboardTabId,
} from "@/components/company/CompanyDashboardTabs";
import CompanyEntrevistasBoard from "@/components/company/CompanyEntrevistasBoard";
import { useCompanyDashboardData } from "@/components/company/CompanyDashboardDataContext";
import { useCompanyDashboardTab } from "@/components/company/CompanyDashboardTabContext";

/**
 * Conteúdo de uma aba (página inteira). Usa cache do layout — troca rápida.
 */
export default function CompanyDashboardSectionPage({ tab }: { tab: CompanyDashboardTabId }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    planFeatures,
    talentLists,
    entrevistas,
    alerts,
    ensureTabData,
    refreshTabData,
    hasTabData,
  } = useCompanyDashboardData();
  const { setActiveTab } = useCompanyDashboardTab();

  const cached = hasTabData(tab);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (hasTabData(tab)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void ensureTabData(tab).then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [status, tab, ensureTabData, hasTabData]);

  const handleCreateAlert = async () => {
    const name = window.prompt("Nome do alerta (ex: Operadores CNC SP):");
    if (!name?.trim()) return;
    const cargo = window.prompt("Cargo desejado (filtro mínimo para o alerta):");
    if (!cargo?.trim()) {
      alert("Informe ao menos um cargo, ou volte ao Início e use os filtros de busca para criar um alerta mais completo.");
      return;
    }
    const res = await fetch("/api/company/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: name.trim(), filters: { cargo: cargo.trim() } }),
    });
    if (res.ok) await refreshTabData("alertas");
    else alert((await res.json()).error || "Erro ao criar alerta");
  };

  const handleToggleAlert = async (alertId: string, active: boolean) => {
    await fetch("/api/company/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ alertId, active }),
    });
    await refreshTabData("alertas");
  };

  const handleDeleteAlert = async (alertId: string) => {
    await fetch(`/api/company/alerts?alertId=${alertId}`, { method: "DELETE", credentials: "include" });
    await refreshTabData("alertas");
  };

  const handleOpenAlertMatches = (alert: CompanyAlert) => {
    try {
      window.sessionStorage.setItem("company-open-alert-filters", JSON.stringify(alert.filters || {}));
    } catch {
      /* ignore */
    }
    setActiveTab("inicio");
  };

  const handleCreateTalentList = async () => {
    const name = window.prompt("Nome da lista (ex: Qualidade):");
    if (!name?.trim()) return;
    const res = await fetch("/api/company/talent-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "createList", name: name.trim() }),
    });
    if (res.ok) await refreshTabData("banco");
    else alert((await res.json()).error || "Erro ao criar lista");
  };

  const handleOpenTalentList = async (list: TalentList) => {
    try {
      window.sessionStorage.setItem(
        "company-open-talent-list",
        JSON.stringify({ id: list.id, name: list.name }),
      );
    } catch {
      /* ignore */
    }
    setActiveTab("inicio");
  };

  const openProfile = (profileId: string) => {
    router.push(`/company/professional/${profileId}`);
  };

  const bypass = matchesCompanyTestBypass({
    email: session?.user?.email,
    userName: session?.user?.name,
  });
  if (status === "unauthenticated" && !bypass) return null;

  return (
    <main style={{ padding: "16px 24px" }}>
      {tab === "entrevistas" ? (
        <CompanyEntrevistasBoard />
      ) : loading && !cached ? (
        <AmpulhetaLoading label="Carregando..." size={32} color={DASH.gold} />
      ) : (
        <CompanyDashboardTabPanel
          tab={tab}
          canUseTalentBank={Boolean(planFeatures.canUseTalentBank)}
          talentListsDetalhadas={talentLists}
          onCreateList={handleCreateTalentList}
          onOpenList={handleOpenTalentList}
          onOpenProfile={openProfile}
          entrevistas={entrevistas}
          canUseAlerts={Boolean(planFeatures.canUseAlerts)}
          alerts={alerts}
          onCreateAlert={handleCreateAlert}
          onToggleAlert={handleToggleAlert}
          onDeleteAlert={handleDeleteAlert}
          onOpenAlertMatches={handleOpenAlertMatches}
          canContactRecruta={Boolean(planFeatures.canContactRecruta)}
        />
      )}
    </main>
  );
}
