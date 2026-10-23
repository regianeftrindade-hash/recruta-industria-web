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
import {
  CompanyDashboardTabProvider,
  useCompanyDashboardTab,
} from "@/components/company/CompanyDashboardTabContext";
import CompanyDashboardTabContent from "@/components/company/CompanyDashboardTabContent";
import CompanyInterviewConfirmBanner from "@/components/company/CompanyInterviewConfirmBanner";
import { matchesCompanyTestBypass } from "@/lib/company/company-test-bypass-shared";
import {
  COMPANY_FIELDS_NOTICE,
  COMPANY_VIEW_ONLY_NOTICE,
  companyVerificationTag,
} from "@/lib/company/company-verification";
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
  const { setActiveTab } = useCompanyDashboardTab();
  const { refreshChrome, planReady, planTier, ensureChrome, refreshTabData } = dash;
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
    window.location.href = "/api/auth/logout?redirect=/";
  };

  if (!mounted || status === "loading") {
    return (
      <DashboardThemeShell className="ri-company-dash">
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

  const navBadges = dash.getBadges();
  const verificationTag = dash.verificationStatus
    ? companyVerificationTag({
        verificationStatus: dash.verificationStatus,
        cartaoCnpjUrl: dash.companyProfile?.cartaoCnpjUrl,
        emailCorporativo: dash.companyProfile?.emailCorporativo,
      })
    : null;
  const camposVerificacaoVazios = !dash.companyProfile?.cartaoCnpjUrl?.trim()
    || !dash.companyProfile?.emailCorporativo?.trim();

  return (
      <DashboardThemeShell className="ri-company-dash">
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
            <span className="ri-dash-access-tag">Acesso Empresa</span>
            {verificationTag ? (
              <span
                style={{
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  marginTop: 2,
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: "1px solid #8D6B1F",
                  background: verificationTag === "Empresa verificada"
                    ? "#1a3d1a"
                    : verificationTag === "Verificação recusada"
                      ? "#3d1a1a"
                      : "#E8C56A",
                  color: verificationTag === "Empresa verificada"
                    ? "#9ae6b4"
                    : verificationTag === "Verificação recusada"
                      ? "#f87171"
                      : "#24180a",
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                {verificationTag}
              </span>
            ) : null}
          </div>
          <div
            className="ri-company-header-actions"
            style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}
          >
            <span className="ri-company-header-meta" style={{ fontSize: 10, ...dashPlanAccent }}>
              {dash.planReady && dash.planTier ? `Plano ${dash.planTier}` : "Carregando plano…"}
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
            <button type="button" onClick={handleLogout} style={{ ...btnGold, padding: "5px 10px", fontSize: 10 }}>
              Sair
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
          <CompanyDashboardNav badges={navBadges} />
        </div>
      </header>

      {dash.planReady && !dash.canPublishAndSearch ? (
        <div
          role="status"
          style={{
            margin: "10px 16px 0",
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid #8D6B1F",
            background: "rgba(200,155,60,0.12)",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: DASH.text, lineHeight: 1.5 }}>
            {COMPANY_VIEW_ONLY_NOTICE}
          </p>
          {camposVerificacaoVazios ? (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: DASH.muted, lineHeight: 1.45 }}>
              {COMPANY_FIELDS_NOTICE}
            </p>
          ) : null}
        </div>
      ) : null}

      <CompanyInterviewConfirmBanner
        onOpenEntrevistas={() => {
          setActiveTab("entrevistas");
          void refreshTabData("entrevistas");
        }}
      />

      <CompanyDashboardTabContent />
    </DashboardThemeShell>
  );
}
