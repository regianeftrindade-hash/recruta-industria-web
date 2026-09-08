"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CompanyCandidateProfilePanel from "@/app/components/CompanyCandidateProfilePanel";
import DashboardThemeToggle from "@/app/components/DashboardThemeToggle";
import LogoRecruta from "@/app/components/LogoRecruta";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import "@/app/dashboard/dashboard-theme.css";
import { DASH, DashboardThemeShell, dashHeader } from "@/lib/dashboard-theme";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import { companyProfessionalPath } from "@/lib/profile/public-slug";

/**
 * Perfil do candidato (empresa).
 * URL canônica: /company/profissional/soldador-sao-paulo-sp-ok51e
 * Aceita também o id antigo na mesma rota (resolve via API).
 */
export default function CompanyProfissionalSlugPage() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const rawParam = typeof params.slug === "string" ? params.slug : "";
  const [profileId, setProfileId] = useState("");
  const [canonicalSlug, setCanonicalSlug] = useState("");
  const [resolveError, setResolveError] = useState("");

  useEffect(() => {
    if (!rawParam || status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      setResolveError("");
      try {
        const res = await fetch(
          `/api/company/professionals/resolve?ref=${encodeURIComponent(rawParam)}`,
          { credentials: "include" },
        );
        const data = (await res.json().catch(() => ({}))) as {
          profileId?: string;
          slug?: string;
          error?: string;
        };
        if (cancelled) return;
        if (res.ok && data.profileId) {
          setProfileId(data.profileId);
          if (data.slug) {
            setCanonicalSlug(data.slug);
            if (data.slug !== rawParam) {
              router.replace(companyProfessionalPath(data.slug));
            }
          }
          return;
        }
        // Fallback: URL ainda com id antigo (cuid) — abre direto.
        if (/^c[a-z0-9]{20,}$/i.test(rawParam)) {
          setProfileId(rawParam);
          return;
        }
        setResolveError(data.error || "Perfil não encontrado");
      } catch {
        if (cancelled) return;
        if (/^c[a-z0-9]{20,}$/i.test(rawParam)) {
          setProfileId(rawParam);
          return;
        }
        setResolveError("Erro ao abrir o perfil");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rawParam, status, router]);

  if (status === "loading" || (status === "authenticated" && rawParam && !profileId && !resolveError)) {
    return (
      <DashboardThemeShell>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AmpulhetaLoading label="Carregando perfil..." size={42} color={DASH.gold} />
        </div>
      </DashboardThemeShell>
    );
  }

  if (!rawParam || resolveError) {
    return (
      <DashboardThemeShell>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <p style={{ color: resolveError ? "#f88" : DASH.muted }}>{resolveError || "Perfil inválido."}</p>
          <button
            type="button"
            onClick={() => router.push("/company/dashboard-empresa")}
            style={{ ...btnGold, padding: "8px 14px", fontSize: 12 }}
          >
            Voltar à vitrine
          </button>
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
          onUnlocked={() => {
            if (canonicalSlug) router.replace(companyProfessionalPath(canonicalSlug));
            else router.refresh();
          }}
        />
      </main>
    </DashboardThemeShell>
  );
}
