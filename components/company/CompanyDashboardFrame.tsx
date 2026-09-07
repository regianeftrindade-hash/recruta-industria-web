"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LogoRecruta from "@/app/components/LogoRecruta";
import DashboardThemeToggle from "@/app/components/DashboardThemeToggle";
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import AnonymousModeToggle from "@/components/company/AnonymousModeToggle";
import { CompanyDashboardNav } from "@/components/company/CompanyDashboardTabs";
import {
  CompanyDashboardDataProvider,
  useCompanyDashboardData,
} from "@/components/company/CompanyDashboardDataContext";
import { CompanyDashboardTabProvider } from "@/components/company/CompanyDashboardTabContext";
import CompanyDashboardTabContent from "@/components/company/CompanyDashboardTabContent";
import { matchesCompanyTestBypass } from "@/lib/company/company-test-bypass-shared";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import {
  DASH,
  DashboardThemeShell,
  dashHeader,
  dashPlanAccent,
} from "@/lib/dashboard-theme";
import "@/app/dashboard/dashboard-theme.css";

/**
 * Moldura fixa do dashboard empresa: header + abas sempre no mesmo lugar.
 * Plano vem do cache compartilhado — sem flash de FREE.
 */
export default function CompanyDashboardFrame({ children }: { children: React.ReactNode }) {
  return (
    <CompanyDashboardDataProvider>
      <CompanyDashboardTabProvider>
        <CompanyDashboardFrameInner>{children}</CompanyDashboardFrameInner>
      </CompanyDashboardTabProvider>
    </CompanyDashboardDataProvider>
  );
}

function CompanyDashboardFrameInner({ children: _children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const dash = useCompanyDashboardData();
  const { refreshChrome, planReady, planTier, ensureChrome } = dash;
  const [mounted, setMounted] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [savingAnonMode, setSavingAnonMode] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated" && mounted) {
      router.push("/login?redirect=/company/dashboard-empresa");
    }
  }, [status, mounted, router]);

  // Só busca o plano depois da sessão autenticada (evita cachear 401 como FREE)
  useEffect(() => {
    if (status !== "authenticated" || !mounted) return;
    if (planReady && planTier) {
      void ensureChrome();
      return;
    }
    void refreshChrome();
  }, [status, mounted, planReady, planTier, ensureChrome, refreshChrome]);

  useEffect(() => {
    if (status !== "authenticated" || !mounted) return;
    let cancelled = false;
    void fetch("/api/company/preferences", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setAnonymousMode(data.anonymousMode === true);
      })
      .finally(() => {
        if (!cancelled) setPrefsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [status, mounted]);

  const handleToggleAnonymousMode = async () => {
    const next = !anonymousMode;
    setSavingAnonMode(true);
    setAnonymousMode(next);
    try {
      const res = await fetch("/api/company/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ anonymousMode: next }),
      });
      if (!res.ok) setAnonymousMode(!next);
    } catch {
      setAnonymousMode(!next);
    } finally {
      setSavingAnonMode(false);
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  if (!mounted || status === "loading") {
    return (
      <DashboardThemeShell>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AmpulhetaLoading label="Carregando..." size={42} color={DASH.gold} />
        </div>
      </DashboardThemeShell>
    );
  }

  const bypass = matchesCompanyTestBypass({
    email: session?.user?.email,
    userName: session?.user?.name,
  });
  if (status === "unauthenticated" && !bypass) return null;

  const maxUnlocksLabel = dash.maxUnlocks === null ? "∞" : String(dash.maxUnlocks);
  const navBadges = dash.getBadges();

  return (
    <DashboardThemeShell>
      <header
        style={{
          ...dashHeader,
          padding: "6px 20px 0",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            paddingBottom: 6,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <LogoRecruta size="xs" as="h1" depth />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, ...dashPlanAccent }}>
              {dash.planReady && dash.planTier
                ? `Plano ${dash.planTier} · Liberações: ${dash.unlockedCount}/${maxUnlocksLabel}`
                : "Carregando plano…"}
            </span>
            {prefsReady ? (
              <AnonymousModeToggle
                active={anonymousMode}
                disabled={savingAnonMode}
                onChange={() => void handleToggleAnonymousMode()}
              />
            ) : null}
            <DashboardThemeToggle />
            <InstallAppPrompt variant="inline" />
            {dash.planReady && dash.isOwner ? (
              <button
                type="button"
                onClick={() => router.push("/company/register?edit=1")}
                style={{ ...btnGold, padding: "5px 10px", fontSize: 10 }}
              >
                Atualizar cadastro
              </button>
            ) : null}
            <button type="button" onClick={handleLogout} style={{ ...btnGold, padding: "5px 10px", fontSize: 10 }}>
              Sair
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
          <CompanyDashboardNav badges={navBadges} />
        </div>
      </header>

      <CompanyDashboardTabContent />
    </DashboardThemeShell>
  );
}
