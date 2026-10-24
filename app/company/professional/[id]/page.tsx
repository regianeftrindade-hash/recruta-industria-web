"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CompanyCandidateProfilePanel from "@/app/components/CompanyCandidateProfilePanel";
import DashboardThemeToggle from "@/app/components/DashboardThemeToggle";
import LogoRecruta from "@/app/components/LogoRecruta";
import "@/app/dashboard/dashboard-theme.css";
import { DashboardThemeShell, dashHeader } from "@/lib/dashboard-theme";
import { botaoPerfil, COR_DOURADO, COR_PRETO } from "@/lib/ui/perfil-empresa-cores";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";

/** Perfil do candidato (empresa) — abre direto pelo id, sem API de resolve. */
export default function CompanyProfessionalPage() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const profileId = typeof params.id === "string" ? params.id : "";

  if (status === "loading") {
    return (
      <DashboardThemeShell>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AmpulhetaLoading label="Carregando perfil..." size={42} color={COR_DOURADO} />
        </div>
      </DashboardThemeShell>
    );
  }

  if (!profileId) {
    return (
      <DashboardThemeShell>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: COR_PRETO }}>Perfil inválido.</p>
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
            style={{ ...botaoPerfil, padding: "8px 14px", fontSize: 12 }}
          >
            Voltar à vitrine
          </button>
        </div>
      </header>

      <main
        style={{
          padding: "16px 12px 32px",
          maxWidth: 1200,
          margin: "0 auto",
          minWidth: 0,
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <CompanyCandidateProfilePanel
          profileId={profileId}
          onBack={() => router.push("/company/dashboard-empresa")}
          onUnlocked={() => router.refresh()}
        />
      </main>
    </DashboardThemeShell>
  );
}
