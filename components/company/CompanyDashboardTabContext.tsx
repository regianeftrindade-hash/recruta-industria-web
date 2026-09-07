"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CompanyDashboardTabId } from "@/components/company/CompanyDashboardTabs";

export type CompanyDashboardActiveTab = CompanyDashboardTabId | "inicio";

const BASE = "/company/dashboard-empresa";

const TAB_IDS: CompanyDashboardTabId[] = [
  "entrevistas",
  "equipe",
  "banco",
  "alertas",
  "contato",
  "meu-plano",
];

function isTabId(value: string | null | undefined): value is CompanyDashboardTabId {
  return Boolean(value && TAB_IDS.includes(value as CompanyDashboardTabId));
}

function tabFromLegacyPath(pathname: string): CompanyDashboardActiveTab | null {
  for (const id of TAB_IDS) {
    if (pathname === `${BASE}/${id}` || pathname.startsWith(`${BASE}/${id}/`)) {
      return id;
    }
  }
  if (pathname === `${BASE}/chat`) return "equipe";
  if (pathname === `${BASE}/avaliacoes`) return "inicio";
  return null;
}

function resolveTab(pathname: string, tabParam: string | null): CompanyDashboardActiveTab {
  if (isTabId(tabParam)) return tabParam;
  const legacy = tabFromLegacyPath(pathname);
  if (legacy) return legacy;
  return "inicio";
}

function hrefForTab(tab: CompanyDashboardActiveTab): string {
  return tab === "inicio" ? BASE : `${BASE}?tab=${tab}`;
}

type Ctx = {
  activeTab: CompanyDashboardActiveTab;
  setActiveTab: (tab: CompanyDashboardActiveTab) => void;
};

const CompanyDashboardTabContext = createContext<Ctx | null>(null);

export function CompanyDashboardTabProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || BASE;
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTabState] = useState<CompanyDashboardActiveTab>(() =>
    resolveTab(pathname, tabParam),
  );

  useEffect(() => {
    setActiveTabState(resolveTab(pathname, tabParam));
  }, [pathname, tabParam]);

  const setActiveTab = useCallback(
    (tab: CompanyDashboardActiveTab) => {
      setActiveTabState(tab);
      router.replace(hrefForTab(tab), { scroll: false });
    },
    [router],
  );

  const value = useMemo(() => ({ activeTab, setActiveTab }), [activeTab, setActiveTab]);

  return (
    <CompanyDashboardTabContext.Provider value={value}>{children}</CompanyDashboardTabContext.Provider>
  );
}

export function useCompanyDashboardTab() {
  const ctx = useContext(CompanyDashboardTabContext);
  if (!ctx) {
    throw new Error("useCompanyDashboardTab deve ser usado dentro de CompanyDashboardTabProvider");
  }
  return ctx;
}
