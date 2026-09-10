/* 🔒 BLOQUEADO (06/07/2026) — não editar sem pedido explícito. Ver .cursor/rules/dashboard-page-lock.mdc */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  EMPTY_FILTROS,
  filtrosTemValor,
  type Filtros,
} from "@/components/company/CompanyDashboardVitrineSearchFilters";
import {
  PAGINACAO_INICIAL,
  PER_PAGE_PERFIS,
  type PaginacaoInfo,
  type ProfissionalResumo,
} from "@/components/company/CompanyDashboardVitrineSection";
import type { CompanyAlert, TalentList } from "@/app/components/CompanyDashboardTools";
import type { CompanyPlanTier } from "@/lib/company-premium-plans";

export interface PlanFeatures {
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

type UseCompanyDashboardInicioSearchOptions = {
  mounted: boolean;
  status: string;
  setPlanTier: React.Dispatch<React.SetStateAction<CompanyPlanTier>>;
  setPlanFeatures: React.Dispatch<React.SetStateAction<PlanFeatures>>;
  setUnlockedCount: React.Dispatch<React.SetStateAction<number>>;
  setSlotsRestantes: React.Dispatch<React.SetStateAction<number | null>>;
  carregarPerfilEmpresa: () => Promise<void>;
};

export function useCompanyDashboardInicioSearch({
  mounted,
  status,
  setPlanTier,
  setPlanFeatures,
  setUnlockedCount,
  setSlotsRestantes,
  carregarPerfilEmpresa,
}: UseCompanyDashboardInicioSearchOptions) {
  const [desbloqueados, setDesbloqueados] = useState<ProfissionalResumo[]>([]);
  const [desbloqueadosTotal, setDesbloqueadosTotal] = useState(0);
  const [profissionais, setProfissionais] = useState<ProfissionalResumo[]>([]);
  const [canUnlock, setCanUnlock] = useState(false);
  const [loadingProfissionais, setLoadingProfissionais] = useState(false);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [erroBusca, setErroBusca] = useState("");
  const [msgAcao, setMsgAcao] = useState("");
  const [totalEncontrados, setTotalEncontrados] = useState(0);
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
  }, [filtros, setPlanTier, setPlanFeatures, setUnlockedCount, setSlotsRestantes]);

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
  }, [setPlanTier, setPlanFeatures, setUnlockedCount, setSlotsRestantes]);

  const irParaPagina = useCallback((page: number) => {
    if (vitrineIds) {
      void abrirPerfisPorIds(vitrineIds, "Erro ao abrir lista do banco de talentos", page, vitrineListaNome);
    } else {
      void buscarProfissionais(page);
    }
    vitrinePerfisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [abrirPerfisPorIds, buscarProfissionais, vitrineIds, vitrineListaNome]);

  const carregarAlertas = useCallback(async () => {
    try {
      const res = await fetch("/api/company/alerts?matches=1", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch { /* opcional */ }
  }, []);

  const handleUnlock = async (profileId: string) => {
    setUnlockingId(profileId);
    setErroBusca("");
    setMsgAcao("");
    try {
      const res = await fetch("/api/company/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErroBusca(data.error || "Erro ao desbloquear");
        return;
      }
      await buscarProfissionais(paginaPerfis);
      await carregarPerfilEmpresa();
      setMsgAcao("Contato liberado.");
    } catch {
      setErroBusca("Erro de rede ao desbloquear perfil");
    } finally {
      setUnlockingId(null);
    }
  };

  const handleCreateAlert = async () => {
    const temPreferencia = (Object.keys(EMPTY_FILTROS) as (keyof Filtros)[]).some((key) => Boolean(filtros[key]));
    if (!temPreferencia) {
      setErroBusca("Defina ao menos um filtro de preferência antes de criar o alerta.");
      setMsgAcao("");
      return;
    }
    const name = window.prompt("Nome do alerta (ex: Operadores CNC SP):");
    if (!name?.trim()) return;
    const filtersLimpos = Object.fromEntries(
      (Object.keys(EMPTY_FILTROS) as (keyof Filtros)[])
        .filter((key) => Boolean(filtros[key]))
        .map((key) => [key, filtros[key]]),
    );
    setErroBusca("");
    setMsgAcao("");
    const res = await fetch("/api/company/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: name.trim(), filters: filtersLimpos }),
    });
    if (res.ok) {
      await carregarAlertas();
      setMsgAcao("Alerta criado.");
    } else {
      setErroBusca((await res.json()).error || "Erro ao criar alerta");
    }
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

  const onBuscar = () => {
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
    setMsgAcao("");
    setPaginaPerfis(1);
    setBuscaRealizada(true);
    void buscarProfissionais(1);
  };

  const onLimpar = () => {
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
    setMsgAcao("");
  };

  const onToggleBuscaAvancada = () => setBuscaAvancadaAberta((v) => !v);

  return {
    desbloqueados,
    desbloqueadosTotal,
    profissionais,
    canUnlock,
    loadingProfissionais,
    unlockingId,
    erroBusca,
    msgAcao,
    totalEncontrados,
    alerts,
    vitrineListaNome,
    filtros,
    setFiltros,
    cidadesOpcoes,
    buscaAvancadaAberta,
    buscaRealizada,
    paginaPerfis,
    paginacao,
    vitrinePerfisRef,
    buscarProfissionais,
    irParaPagina,
    carregarAlertas,
    handleUnlock,
    handleCreateAlert,
    handleToggleAlert,
    handleDeleteAlert,
    handleOpenAlertMatches,
    handleOpenTalentList,
    handleExportProfile,
    onBuscar,
    onLimpar,
    onToggleBuscaAvancada,
  };
}
