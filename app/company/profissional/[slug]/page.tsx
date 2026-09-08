"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import CompanyCandidateProfilePanel from "@/app/components/CompanyCandidateProfilePanel";
import DashboardThemeToggle from "@/app/components/DashboardThemeToggle";
import LogoRecruta from "@/app/components/LogoRecruta";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import "@/app/dashboard/dashboard-theme.css";
import { DASH, DashboardThemeShell, dashHeader } from "@/lib/dashboard-theme";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import { companyProfessionalPath, looksLikeProfileCuid } from "@/lib/profile/public-slug";

/**
 * Perfil do candidato (empresa).
 * Abre pelo ?id= (confiável). O slug na URL é só visual.
 */
function CompanyProfissionalSlugPageInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const rawParam = typeof params.slug === "string" ? params.slug : "";
  const idFromQuery = (searchParams.get("id") || "").trim();

  const [profileId, setProfileId] = useState(() =>
    idFromQuery && looksLikeProfileCuid(idFromQuery)
      ? idFromQuery
      : looksLikeProfileCuid(rawParam)
        ? rawParam
        : "",
  );
  const [resolveError, setResolveError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;

    // Caminho feliz: id veio na query ou o path já é o cuid.
    if (idFromQuery && looksLikeProfileCuid(idFromQuery)) {
      setProfileId(idFromQuery);
      setResolveError("");
      return;
    }
    if (looksLikeProfileCuid(rawParam)) {
      setProfileId(rawParam);
      setResolveError("");
      return;
    }

    if (!rawParam) {
      setResolveError("Perfil inválido.");
      return;
    }

    // Só slug sem id: tenta resolve (não bloqueia se falhar e tiver fallback).
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
            router.replace(companyProfessionalPath(data.slug, data.profileId));
          }
          return;
        }
        setResolveError(data.error || "Perfil não encontrado");
      } catch {
        if (!cancelled) setResolveError("Erro ao abrir o perfil");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rawParam, idFromQuery, status, router]);

  if (status === "loading" || (status === "authenticated" && !profileId && !resolveError)) {
    return (
      <DashboardThemeShell>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AmpulhetaLoading label="Carregando perfil..." size={42} color={DASH.gold} />
        </div>
      </DashboardThemeShell>
    );
  }

  if (resolveError && !profileId) {
    return (
      <DashboardThemeShell>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <p style={{ color: "#f88" }}>{resolveError}</p>
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
          onUnlocked={() => router.refresh()}
        />
      </main>
    </DashboardThemeShell>
  );
}

export default function CompanyProfissionalSlugPage() {
  return (
    <Suspense
      fallback={
        <DashboardThemeShell>
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AmpulhetaLoading label="Carregando perfil..." size={42} color={DASH.gold} />
          </div>
        </DashboardThemeShell>
      }
    >
      <CompanyProfissionalSlugPageInner />
    </Suspense>
  );
}
