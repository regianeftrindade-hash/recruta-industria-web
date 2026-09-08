/* 🔒 BLOQUEADO (06/07/2026) — não editar sem pedido explícito. Ver .cursor/rules/dashboard-page-lock.mdc */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CompanyPlanCards from "@/app/components/CompanyPlanCards";
import { matchesCompanyTestBypass } from "@/lib/company/company-test-bypass-shared";
import {
  DashboardStatsBar,
  type DashboardStats,
} from "@/app/components/CompanyDashboardTools";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import { useCompanyDashboardData } from "@/components/company/CompanyDashboardDataContext";
import CompanyDashboardVitrineSearchFilters from "@/components/company/CompanyDashboardVitrineSearchFilters";
import CompanyDashboardVitrineSection from "@/components/company/CompanyDashboardVitrineSection";
import CompanyDashboardVerificationBanner from "@/components/company/CompanyDashboardVerificationBanner";
import {
  useCompanyDashboardInicioSearch,
  type PlanFeatures,
} from "@/components/company/useCompanyDashboardInicioSearch";
import type { CompanyPlanTier } from "@/lib/company-premium-plans";
import type { CompanyVerificationStatus } from "@/lib/company/company-verification";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { companyProfessionalPath } from "@/lib/profile/public-slug";
import "@/app/dashboard/dashboard-theme.css";
import {
  DASH,
  dashCard,
  dashSectionTitle,
} from "@/lib/dashboard-theme";

interface SessionUser {
  id: string;
  email: string;
  name?: string;
  userType?: string;
}

interface CompanyProfile {
  id: string;
  razaoSocial: string;
  cnpj: string | null;
  responsavelNome: string | null;
  responsavelCpf: string | null;
  telefone: string | null;
  endereco: string | null;
  emailCorporativo: string | null;
  emailCorporativoVerificado: boolean;
  logoUrl?: string | null;
  fotoResponsavelUrl?: string | null;
  email: string;
}

export default function CompanyDashboardInicioPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const dash = useCompanyDashboardData();
  const [mounted, setMounted] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<CompanyVerificationStatus>("PENDING");
  const [verificationReason, setVerificationReason] = useState<string | null>(null);
  const [canAccessSensitiveProfiles, setCanAccessSensitiveProfiles] = useState(false);
  const [emailCorporativoVerificado, setEmailCorporativoVerificado] = useState(false);
  const [isCompanyAccount, setIsCompanyAccount] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [slotsRestantes, setSlotsRestantes] = useState<number | null>(0);
  const [planTier, setPlanTier] = useState<CompanyPlanTier>("FREE");
  const [planLoaded, setPlanLoaded] = useState(false);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures>({
    canUseAdvancedFilters: false,
    canUnlockContacts: false,
    canFavorite: false,
    canSendTips: false,
    canViewContacts: false,
    canUseAlerts: false,
    canUseTalentBank: false,
    canExportProfiles: false,
    canViewDashboardStats: false,
    canContactRecruta: false,
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [entrevistasAgendadas, setEntrevistasAgendadas] = useState<
    Array<{
      proposalId: string;
      profileId: string;
      professionalName: string;
      cargo: string;
      scheduledAt: string;
      interviewStatus: string;
    }>
  >([]);

  const carregarPerfilEmpresa = useCallback(async () => {
    try {
      setProfileLoadError("");
      const res = await fetch("/api/company/profile", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCompanyProfile(data.company);
        if (data.verification) {
          setVerificationStatus(data.verification.verificationStatus);
          setVerificationReason(data.verification.rejectionReason || null);
          setCanAccessSensitiveProfiles(data.verification.canAccessSensitiveProfiles === true);
          setEmailCorporativoVerificado(data.verification.isEmailVerified === true);
        }
        setUnlockedCount(data.unlockedCount || 0);
        setSlotsRestantes(data.slotsRestantes ?? null);
        if (data.plan) {
          setPlanTier(data.plan.tier || "FREE");
          setPlanFeatures(data.plan.features || planFeatures);
        }
        setPlanLoaded(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setProfileLoadError(data.error || "Não foi possível carregar o perfil da empresa.");
        setPlanLoaded(true);
      }
    } catch (e) {
      console.error(e);
      setProfileLoadError("Erro de rede ao carregar o perfil da empresa.");
      setPlanLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mesmo contrato da versão monolítica (deps [])
  }, []);

  const search = useCompanyDashboardInicioSearch({
    mounted,
    status,
    setPlanTier,
    setPlanFeatures,
    setUnlockedCount,
    setSlotsRestantes,
    carregarPerfilEmpresa,
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === "unauthenticated" && mounted) {
      router.push("/login?redirect=/company/dashboard-empresa");
      return;
    }

    if (status === "authenticated" && mounted) {
      const email = session?.user?.email || "";
      const bypass = matchesCompanyTestBypass({
        email,
        userName: session?.user?.name,
      });
      const userType = (session?.user as SessionUser | undefined)?.userType?.toUpperCase();
      if (userType === "PROFESSIONAL" && !bypass) {
        router.replace("/company/register");
      }
    }
  }, [status, router, mounted, session]);

  const checkRegistrationStatus = useCallback(async () => {
    const emailBypass = matchesCompanyTestBypass({
      email: session?.user?.email,
      userName: session?.user?.name,
    });

    try {
      const response = await fetch("/api/company/check-registration");
      if (!response.ok) {
        // Conta de teste: libera painel mesmo se a API falhar
        if (emailBypass) {
          setIsCompanyAccount(true);
          setRegistrationComplete(true);
        }
        setIsCheckingRegistration(false);
        return;
      }
      const data = await response.json();
      const bypass = data.testBypass === true || emailBypass;
      setIsCompanyAccount(data.isCompany === true || bypass);
      setRegistrationComplete(data.registrationComplete === true || bypass);
      if (data.verification?.verificationStatus) {
        setVerificationStatus(data.verification.verificationStatus);
        setVerificationReason(data.verification.rejectionReason || null);
        setCanAccessSensitiveProfiles(data.verification.canAccessSensitiveProfiles === true);
        setEmailCorporativoVerificado(data.verification.isEmailVerified === true);
      } else if (bypass) {
        setVerificationStatus("VERIFIED");
        setCanAccessSensitiveProfiles(true);
        setEmailCorporativoVerificado(true);
      }
    } catch (error) {
      console.error("Erro ao verificar registro:", error);
      if (emailBypass) {
        setIsCompanyAccount(true);
        setRegistrationComplete(true);
      }
    } finally {
      setIsCheckingRegistration(false);
    }
  }, [session?.user?.email, session?.user?.name]);

  const carregarStats = useCallback(async () => {
    try {
      const res = await fetch("/api/company/dashboard-stats", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data.stats);
      }
    } catch { /* opcional */ }
  }, []);

  const carregarEntrevistasAgendadas = useCallback(async () => {
    try {
      const res = await fetch("/api/company/proposals/scheduled", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEntrevistasAgendadas(data.interviews || []);
      }
    } catch { /* opcional */ }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && mounted) {
      checkRegistrationStatus();
    }
  }, [status, mounted, checkRegistrationStatus]);

  useEffect(() => {
    if (!dash.planReady || !dash.planTier) return;
    setPlanTier(dash.planTier as CompanyPlanTier);
    if (dash.planFeatures && Object.keys(dash.planFeatures).length > 0) {
      setPlanFeatures((prev) => ({ ...prev, ...dash.planFeatures }));
    }
    if (typeof dash.unlockedCount === "number") setUnlockedCount(dash.unlockedCount);
    if (dash.slotsRestantes !== undefined) setSlotsRestantes(dash.slotsRestantes);
    setPlanLoaded(true);
  }, [dash.planReady, dash.planTier, dash.planFeatures, dash.unlockedCount, dash.slotsRestantes]);

  useEffect(() => {
    if (!mounted || isCheckingRegistration || status !== "authenticated") return;
    const bypass = matchesCompanyTestBypass({
      email: session?.user?.email,
      userName: session?.user?.name,
    });
    if (!isCompanyAccount && !bypass) {
      router.replace("/professional/dashboard");
    }
  }, [mounted, isCheckingRegistration, isCompanyAccount, status, router, session?.user?.email, session?.user?.name]);

  useEffect(() => {
    const bypass = matchesCompanyTestBypass({
      email: session?.user?.email,
      userName: session?.user?.name,
    });
    if ((registrationComplete || bypass) && status === "authenticated") {
      void carregarPerfilEmpresa();
      void carregarStats();
    }
  }, [registrationComplete, status, carregarPerfilEmpresa, carregarStats, session?.user?.email, session?.user?.name]);

  const handleSelectFreePlan = async () => {
    try {
      const res = await fetch("/api/company/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planTier: "FREE" }),
      });
      if (res.ok) {
        await carregarPerfilEmpresa();
        await search.buscarProfissionais(search.paginaPerfis);
      }
    } catch {
      alert("Erro ao alterar plano");
    }
  };

  const openProfile = (profileIdOrSlug: string) => {
    router.push(companyProfessionalPath(profileIdOrSlug));
  };

  const advancedFilterDisabled = planLoaded && !planFeatures.canUseAdvancedFilters;

  const user = session?.user as SessionUser | undefined;

  if (status === "loading" || isCheckingRegistration) {
    return (
      <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AmpulhetaLoading label="Carregando perfil..." size={42} color={DASH.gold} />
      </div>
    );
  }

  if (!user) return null;

  const emailBypassGate = matchesCompanyTestBypass({
    email: user.email,
    userName: user.name,
  });

  if (!registrationComplete && isCompanyAccount && !emailBypassGate) {
    return (
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ maxWidth: 560, ...dashCard, padding: 40, borderRadius: 16, textAlign: "center" }}>
          <h2 style={dashSectionTitle}>Cadastro incompleto</h2>
          <p style={{ color: DASH.text }}>Complete CNPJ, razão social, responsável, telefone e endereço para acessar a vitrine.</p>
          <button onClick={() => router.push("/company/register")} style={{ ...btnGold, padding: "14px 32px", fontSize: 15, marginTop: 10 }}>
            Completar cadastro
          </button>
        </div>
      </main>
    );
  }

  return (
        <>
          {!canAccessSensitiveProfiles && (
            <CompanyDashboardVerificationBanner
              verificationStatus={verificationStatus}
              verificationReason={verificationReason}
              emailCorporativoVerificado={emailCorporativoVerificado}
            />
          )}

          <div style={{ padding: "2px 0 6px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {planFeatures.canViewDashboardStats && dashboardStats && (
            <div>
              <h3 style={{ ...dashSectionTitle, margin: "0 0 6px", fontSize: 13 }}>Dashboard de recrutamento</h3>
              <DashboardStatsBar stats={dashboardStats} />
            </div>
          )}

          <CompanyDashboardVitrineSearchFilters
            filtros={search.filtros}
            cidadesOpcoes={search.cidadesOpcoes}
            buscaAvancadaAberta={search.buscaAvancadaAberta}
            loadingProfissionais={search.loadingProfissionais}
            advancedFilterDisabled={advancedFilterDisabled}
            onFiltrosChange={search.setFiltros}
            onToggleBuscaAvancada={search.onToggleBuscaAvancada}
            onBuscar={search.onBuscar}
            onLimpar={search.onLimpar}
          />

          {search.erroBusca && (
            <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 10, borderRadius: 8, fontSize: 12 }}>
              {search.erroBusca}
            </div>
          )}

          {search.buscaRealizada && search.totalEncontrados > 0 && (
            <p style={{ color: DASH.muted, fontSize: 11, margin: 0 }}>
              {search.totalEncontrados} profissional(is) compatível(is)
              {search.desbloqueadosTotal > 0 ? ` · ${search.desbloqueadosTotal} desbloqueado(s)` : ""}
              {search.paginacao.totalPages > 1 ? ` · página ${search.paginacao.page} de ${search.paginacao.totalPages}` : ""}
              {" "}— ordenados por índice de compatibilidade.
            </p>
          )}

          <CompanyDashboardVitrineSection
            sectionRef={search.vitrinePerfisRef}
            vitrineListaNome={search.vitrineListaNome}
            buscaRealizada={search.buscaRealizada}
            paginacao={search.paginacao}
            totalEncontrados={search.totalEncontrados}
            loadingProfissionais={search.loadingProfissionais}
            profissionais={search.profissionais}
            canUnlock={search.canUnlock}
            slotsRestantes={slotsRestantes}
            canExportProfiles={planFeatures.canExportProfiles}
            unlockingId={search.unlockingId}
            openProfile={openProfile}
            handleUnlock={search.handleUnlock}
            handleExportProfile={search.handleExportProfile}
            irParaPagina={search.irParaPagina}
          />

          <section style={{ marginTop: 2, marginBottom: 4 }}>
            <CompanyPlanCards
              currentTier={planLoaded ? planTier : null}
              onSelectFree={handleSelectFreePlan}
            />
          </section>
          </div>
        </>
  );
}
