"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CompanyCandidateProfilePanel from "@/app/components/CompanyCandidateProfilePanel";
import DashboardThemeToggle from "@/app/components/DashboardThemeToggle";
import LogoRecruta from "@/app/components/LogoRecruta";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import "@/app/dashboard/dashboard-theme.css";
import { DASH, DashboardThemeShell, dashHeader } from "@/lib/dashboard-theme";

export default function CompanyProfessionalPage() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const profileId = typeof params.id === "string" ? params.id : "";

  if (status === "loading") {
    return (
      <DashboardThemeShell>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: DASH.text, fontSize: 16 }}>Carregando...</p>
        </div>
      </DashboardThemeShell>
    );
  }

  if (!profileId) {
    return (
      <DashboardThemeShell>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: DASH.muted }}>Perfil inválido.</p>
        </div>
      </DashboardThemeShell>
    );
  }

  return (
    <DashboardThemeShell style={{ width: "100%", maxWidth: "none" }}>
      <header style={{ ...dashHeader, padding: "14px 20px" }}>
        <LogoRecruta size="xs" as="span" depth />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <DashboardThemeToggle />
          <button
            type="button"
            onClick={() => router.push("/company/dashboard-empresa")}
            style={{ ...btnGold, padding: "8px 14px", fontSize: 12 }}
          >
            Voltar à vitrine
          </button>
        </div>
      </header>

      <main style={{ padding: "20px 24px 40px", maxWidth: 1200, margin: "0 auto", minWidth: 0 }}>
        <CompanyCandidateProfilePanel
          profileId={profileId}
          onBack={() => router.push("/company/dashboard-empresa")}
          onUnlocked={() => router.refresh()}
        />
      </main>
    </DashboardThemeShell>
  );
}
