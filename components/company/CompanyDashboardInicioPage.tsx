/* 🔒 BLOQUEADO (06/07/2026) — não editar sem pedido explícito. Ver .cursor/rules/dashboard-page-lock.mdc */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CompanyPlanCards from "@/app/components/CompanyPlanCards";
import { matchesCompanyTestBypass } from "@/lib/company/company-test-bypass-shared";
import {
  DashboardStatsBar,
  type CompanyAlert,
  type DashboardStats,
  type TalentList,
} from "@/app/components/CompanyDashboardTools";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import { useCompanyDashboardData } from "@/components/company/CompanyDashboardDataContext";
import CompanyDashboardVitrineSearchFilters, {
  EMPTY_FILTROS,
  filtrosTemValor,
  type Filtros,
} from "@/components/company/CompanyDashboardVitrineSearchFilters";
import CompanyDashboardVitrineSection, {
  PAGINACAO_INICIAL,
  PER_PAGE_PERFIS,
  type PaginacaoInfo,
  type ProfissionalResumo,
} from "@/components/company/CompanyDashboardVitrineSection";
import type { CompanyPlanTier } from "@/lib/company-premium-plans";
import type { CompanyVerificationStatus } from "@/lib/company/company-verification";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
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

interface PlanFeatures {
  canUseAdvancedFilters: boolean;
  canUnlockContacts: boolean;
  canFavorite: boolean;
  canSendTips: boolean;
  canSendProposals?: boolean;
  canViewContacts: boolean;
  canUseAlerts?: boolean;
  canUseTalentBank?: boolean;
  canExportProfiles?: boolean;
  canViewDashboardStats?: boolean;
  canContactRecruta?: boolean;
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
  const [desbloqueados, setDesbloqueados] = useState<ProfissionalResumo[]>([]);
  const [desbloqueadosTotal, setDesbloqueadosTotal] = useState(0);
  const [profissionais, setProfissionais] = useState<ProfissionalResumo[]>([]);
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
  const [canUnlock, setCanUnlock] = useState(false);
  const [loadingProfissionais, setLoadingProfissionais] = useState(false);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [erroBusca, setErroBusca] = useState("");
  const [totalEncontrados, setTotalEncontrados] = useState(0);
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
  const [alerts, setAlerts] = useState<CompanyAlert[]>([]);
  const [vitrineIds, setVitrineIds] = useState<string[] | null>(null);
  const [vitrineListaNome, setVitrineListaNome] = useState("");
  const [filtros, setFiltros] = useState<Filtros>(EMPTY_FILTROS);
  const [cidadesOpcoes, setCidadesOpcoes] = useState<string[]>([]);
  const [buscaAvancadaAberta, setBuscaAvancadaAberta] = useState(false);
  const [buscaRealizada, setBuscaRealizada] = useState(false);
  const [paginaPerfis, setPaginaPerfis] = useState(1);
  const [paginacao, setPaginacao] = useState<PaginacaoInfo>(PAGINACAO_INICIAL);
  const vitrinePerfisRef = React.useRef<HTMLElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!filtros.estado) {
      setCidadesOpcoes([]);
      return;
    }

    let ativo = true;
    void fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${filtros.estado}/municipios`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { nome: string }[]) => {
        if (!ativo) return;
        setCidadesOpcoes(
          data
            .map((m) => m.nome)
            .sort((a, b) => a.localeCompare(b, "pt-BR")),
        );
      })
      .catch(() => {
        if (ativo) setCidadesOpcoes([]);
      });

    return () => {
      ativo = false;
    };
  }, [filtros.estado]);

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
  }, []);

  const buscarProfissionais = useCallback(async (page: number) => {
    setVitrineIds(null);
    setVitrineListaNome("");
    setLoadingProfissionais(true);
    setErroBusca("");
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([k, v]) => { if (v) params.set(k, v); });
      params.set("page", String(page));
      params.set("perPage", String(PER_PAGE_PERFIS));
      const res = await fetch(`/api/company/professionals?${params}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setErroBusca(data.error || "Erro ao buscar profissionais");
        return;
      }
      setProfissionais(data.profissionais || data.bloqueados || []);
      setDesbloqueados(data.desbloqueados || []);
      setDesbloqueadosTotal(
        typeof data.desbloqueadosTotal === "number"
          ? data.desbloqueadosTotal
          : (data.desbloqueados?.length ?? 0),
      );
      setUnlockedCount(data.unlockedCount || 0);
      setSlotsRestantes(data.slotsRestantes ?? null);
      setCanUnlock(data.canUnlock ?? false);
      const total = data.totalEncontrados ?? (data.profissionais?.length ?? data.bloqueados?.length ?? 0);
      setTotalEncontrados(total);
      const perPage = data.pagination?.perPage ?? PER_PAGE_PERFIS;
      const totalPages = data.pagination?.totalPages ?? Math.max(1, Math.ceil(total / perPage));
      setPaginacao(
        data.pagination ?? {
          page,
          perPage,
          total,
          totalPages,
        }
      );
      setPaginaPerfis(data.pagination?.page ?? page);
      if (data.planTier) setPlanTier(data.planTier);
      if (data.features) setPlanFeatures(data.features);
    } catch {
      setErroBusca("Erro de rede ao buscar profissionais");
    } finally {
      setLoadingProfissionais(false);
    }
  }, [filtros]);

  const abrirPerfisPorIds = useCallback(async (
    ids: string[],
    erroPadrao: string,
    page = 1,
    listaNome = "",
  ) => {
    setVitrineIds(ids);
    setVitrineListaNome(listaNome);
    if (ids.length === 0) {
      setBuscaRealizada(true);
      setProfissionais([]);
      setDesbloqueados([]);
      setDesbloqueadosTotal(0);
      setTotalEncontrados(0);
      setPaginacao({ page: 1, perPage: PER_PAGE_PERFIS, total: 0, totalPages: 1 });
      setPaginaPerfis(1);
      setErroBusca("");
      vitrinePerfisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setBuscaRealizada(true);
    setLoadingProfissionais(true);
    setErroBusca("");
    try {
      const params = new URLSearchParams();
      params.set("ids", ids.join(","));
      params.set("page", String(page));
      params.set("perPage", String(PER_PAGE_PERFIS));
      const res = await fetch(`/api/company/professionals?${params}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setErroBusca(data.error || erroPadrao);
        return;
      }
      setProfissionais(data.profissionais || data.bloqueados || []);
      setDesbloqueados(data.desbloqueados || []);
      setDesbloqueadosTotal(
        typeof data.desbloqueadosTotal === "number"
          ? data.desbloqueadosTotal
          : (data.desbloqueados?.length ?? 0),
      );
      setUnlockedCount(data.unlockedCount || 0);
      setSlotsRestantes(data.slotsRestantes ?? null);
      setCanUnlock(data.canUnlock ?? false);
      const total = data.totalEncontrados ?? ids.length;
      setTotalEncontrados(total);
      const perPage = data.pagination?.perPage ?? PER_PAGE_PERFIS;
      const totalPages = data.pagination?.totalPages ?? Math.max(1, Math.ceil(total / perPage));
      setPaginacao(
        data.pagination ?? {
          page,
          perPage,
          total,
          totalPages,
        },
      );
      setPaginaPerfis(data.pagination?.page ?? page);
      if (data.planTier) setPlanTier(data.planTier);
      if (data.features) setPlanFeatures(data.features);
      vitrinePerfisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setErroBusca(`Erro de rede: ${erroPadrao}`);
    } finally {
      setLoadingProfissionais(false);
    }
  }, []);

  const irParaPagina = useCallback((page: number) => {
    if (vitrineIds) {
      void abrirPerfisPorIds(vitrineIds, "Erro ao abrir lista do banco de talentos", page, vitrineListaNome);
    } else {
      void buscarProfissionais(page);
    }
    vitrinePerfisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [abrirPerfisPorIds, buscarProfissionais, vitrineIds, vitrineListaNome]);

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

  const carregarAlertas = useCallback(async () => {
    try {
      const res = await fetch("/api/company/alerts?matches=1", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
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

  const handleUnlock = async (profileId: string) => {
    setUnlockingId(profileId);
    try {
      const res = await fetch("/api/company/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao desbloquear");
        return;
      }
      await buscarProfissionais(paginaPerfis);
      await carregarPerfilEmpresa();
    } catch {
      alert("Erro de rede ao desbloquear perfil");
    } finally {
      setUnlockingId(null);
    }
  };

  const handleCreateAlert = async () => {
    const temPreferencia = (Object.keys(EMPTY_FILTROS) as (keyof Filtros)[]).some((key) => Boolean(filtros[key]));
    if (!temPreferencia) {
      alert("Defina ao menos um filtro de preferência antes de criar o alerta.");
      return;
    }
    const name = window.prompt("Nome do alerta (ex: Operadores CNC SP):");
    if (!name?.trim()) return;
    const filtersLimpos = Object.fromEntries(
      (Object.keys(EMPTY_FILTROS) as (keyof Filtros)[])
        .filter((key) => Boolean(filtros[key]))
        .map((key) => [key, filtros[key]]),
    );
    const res = await fetch("/api/company/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: name.trim(), filters: filtersLimpos }),
    });
    if (res.ok) await carregarAlertas();
    else alert((await res.json()).error || "Erro ao criar alerta");
  };

  const handleToggleAlert = async (alertId: string, active: boolean) => {
    await fetch("/api/company/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ alertId, active }),
    });
    await carregarAlertas();
  };

  const handleDeleteAlert = async (alertId: string) => {
    await fetch(`/api/company/alerts?alertId=${alertId}`, { method: "DELETE", credentials: "include" });
    await carregarAlertas();
  };

  const handleOpenAlertMatches = async (alert: CompanyAlert) => {
    setVitrineIds(null);
    setVitrineListaNome("");
    const next: Filtros = { ...EMPTY_FILTROS };
    if (alert.filters) {
      (Object.keys(EMPTY_FILTROS) as (keyof Filtros)[]).forEach((key) => {
        next[key] = String(alert.filters?.[key] ?? "");
      });
    }
    setFiltros(next);

    const temPreferencia = (Object.keys(EMPTY_FILTROS) as (keyof Filtros)[]).some((key) => Boolean(next[key]));
    if (!temPreferencia) {
      setErroBusca("Este alerta não tem preferências de filtro salvas.");
      setBuscaRealizada(true);
      return;
    }

    setBuscaRealizada(true);
    setLoadingProfissionais(true);
    setErroBusca("");
    try {
      const params = new URLSearchParams();
      (Object.keys(EMPTY_FILTROS) as (keyof Filtros)[]).forEach((key) => {
        if (next[key]) params.set(key, next[key]);
      });
      params.set("page", "1");
      params.set("perPage", String(PER_PAGE_PERFIS));
      const res = await fetch(`/api/company/professionals?${params}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setErroBusca(data.error || "Erro ao abrir perfis compatíveis");
        return;
      }
      setProfissionais(data.profissionais || data.bloqueados || []);
      setDesbloqueados(data.desbloqueados || []);
      setDesbloqueadosTotal(
        typeof data.desbloqueadosTotal === "number"
          ? data.desbloqueadosTotal
          : (data.desbloqueados?.length ?? 0),
      );
      setUnlockedCount(data.unlockedCount || 0);
      setSlotsRestantes(data.slotsRestantes ?? null);
      setCanUnlock(data.canUnlock ?? false);
      const total = data.totalEncontrados ?? (data.profissionais?.length ?? data.bloqueados?.length ?? 0);
      setTotalEncontrados(total);
      const perPage = data.pagination?.perPage ?? PER_PAGE_PERFIS;
      const totalPages = data.pagination?.totalPages ?? Math.max(1, Math.ceil(total / perPage));
      setPaginacao(data.pagination ?? { page: 1, perPage, total, totalPages });
      setPaginaPerfis(data.pagination?.page ?? 1);
      if (data.planTier) setPlanTier(data.planTier);
      if (data.features) setPlanFeatures(data.features);
      vitrinePerfisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setErroBusca("Erro de rede ao abrir perfis compatíveis");
    } finally {
      setLoadingProfissionais(false);
    }
  };

  const handleOpenTalentList = async (list: TalentList) => {
    try {
      const res = await fetch(`/api/company/talent-lists?listId=${encodeURIComponent(list.id)}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setErroBusca(data.error || "Erro ao abrir lista do banco de talentos");
        setBuscaRealizada(true);
        return;
      }
      const ids: string[] = Array.isArray(data.profileIds) ? data.profileIds : [];
      await abrirPerfisPorIds(ids, "Erro ao abrir lista do banco de talentos", 1, list.name);
    } catch {
      setErroBusca("Erro de rede ao abrir lista do banco de talentos");
      setBuscaRealizada(true);
    }
  };

  // Ponte das páginas de aba → início (abrir lista / alerta na vitrine)
  useEffect(() => {
    if (!mounted || status !== "authenticated") return;
    try {
      const listRaw = window.sessionStorage.getItem("company-open-talent-list");
      if (listRaw) {
        window.sessionStorage.removeItem("company-open-talent-list");
        const list = JSON.parse(listRaw) as TalentList;
        if (list?.id) void handleOpenTalentList(list);
      }
      const alertRaw = window.sessionStorage.getItem("company-open-alert-filters");
      if (alertRaw) {
        window.sessionStorage.removeItem("company-open-alert-filters");
        const filters = JSON.parse(alertRaw) as Record<string, string>;
        void handleOpenAlertMatches({ id: "", name: "", active: true, filters, newMatches: [] });
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, status]);

  const handleExportProfile = (profileId: string) => {
    window.open(`/api/company/professionals/${profileId}/export`, "_blank");
  };

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
        await buscarProfissionais(paginaPerfis);
      }
    } catch {
      alert("Erro ao alterar plano");
    }
  };

  const openProfile = (profileId: string) => {
    router.push(`/company/professional/${profileId}`);
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
            <div style={{
              margin: "20px 24px 0",
              padding: 12,
              borderRadius: 16,
              border: `1px solid ${verificationStatus === "REJECTED" ? "#dc3545" : DASH.gold}`,
              background: verificationStatus === "REJECTED" ? "rgba(220,53,69,0.12)" : "rgba(200,155,60,0.12)",
            }}>
              <p style={{ margin: 0, fontSize: 13, color: DASH.text, lineHeight: 1.5 }}>
                <strong>Liberação de contatos pendente</strong>
                {' '}— Você pode buscar profissionais, mas dados sensíveis só aparecem quando:
              </p>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, color: DASH.muted, lineHeight: 1.6 }}>
                <li>{emailCorporativoVerificado ? '✓' : '○'} E-mail corporativo confirmado por link</li>
                <li>{verificationStatus === "VERIFIED" ? '✓' : '○'} Cartão CNPJ anexado e aprovado pelo admin</li>
              </ul>
              {verificationStatus === "REJECTED" && verificationReason && (
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "#f87171" }}>{verificationReason}</p>
              )}
            </div>
          )}

          <div style={{ padding: "2px 0 6px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {planFeatures.canViewDashboardStats && dashboardStats && (
            <div>
              <h3 style={{ ...dashSectionTitle, margin: "0 0 6px", fontSize: 13 }}>Dashboard de recrutamento</h3>
              <DashboardStatsBar stats={dashboardStats} />
            </div>
          )}

          <CompanyDashboardVitrineSearchFilters
            filtros={filtros}
            cidadesOpcoes={cidadesOpcoes}
            buscaAvancadaAberta={buscaAvancadaAberta}
            loadingProfissionais={loadingProfissionais}
            advancedFilterDisabled={advancedFilterDisabled}
            onFiltrosChange={setFiltros}
            onToggleBuscaAvancada={() => setBuscaAvancadaAberta((v) => !v)}
            onBuscar={() => {
              if (!filtrosTemValor(filtros)) {
                setErroBusca("Selecione ao menos um filtro para buscar profissionais.");
                setBuscaRealizada(false);
                setProfissionais([]);
                setDesbloqueados([]);
                setDesbloqueadosTotal(0);
                setTotalEncontrados(0);
                setPaginacao(PAGINACAO_INICIAL);
                return;
              }
              setErroBusca("");
              setPaginaPerfis(1);
              setBuscaRealizada(true);
              void buscarProfissionais(1);
            }}
            onLimpar={() => {
              setFiltros(EMPTY_FILTROS);
              setCidadesOpcoes([]);
              setBuscaRealizada(false);
              setProfissionais([]);
              setDesbloqueados([]);
              setDesbloqueadosTotal(0);
              setTotalEncontrados(0);
              setPaginacao(PAGINACAO_INICIAL);
              setPaginaPerfis(1);
              setErroBusca("");
            }}
          />

          {erroBusca && (
            <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 10, borderRadius: 8, fontSize: 12 }}>
              {erroBusca}
            </div>
          )}

          {buscaRealizada && totalEncontrados > 0 && (
            <p style={{ color: DASH.muted, fontSize: 11, margin: 0 }}>
              {totalEncontrados} profissional(is) compatível(is)
              {desbloqueadosTotal > 0 ? ` · ${desbloqueadosTotal} desbloqueado(s)` : ""}
              {paginacao.totalPages > 1 ? ` · página ${paginacao.page} de ${paginacao.totalPages}` : ""}
              {" "}— ordenados por índice de compatibilidade.
            </p>
          )}

          <CompanyDashboardVitrineSection
            sectionRef={vitrinePerfisRef}
            vitrineListaNome={vitrineListaNome}
            buscaRealizada={buscaRealizada}
            paginacao={paginacao}
            totalEncontrados={totalEncontrados}
            loadingProfissionais={loadingProfissionais}
            profissionais={profissionais}
            canUnlock={canUnlock}
            slotsRestantes={slotsRestantes}
            canExportProfiles={planFeatures.canExportProfiles}
            unlockingId={unlockingId}
            openProfile={openProfile}
            handleUnlock={handleUnlock}
            handleExportProfile={handleExportProfile}
            irParaPagina={irParaPagina}
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
