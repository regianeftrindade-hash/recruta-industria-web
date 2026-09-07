"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { CompanyAlert, TalentList } from "@/app/components/CompanyDashboardTools";
import type {
  CompanyDashboardTabId,
  TalentListDetalhada,
} from "@/components/company/CompanyDashboardTabs";

export type CompanyPlanFeatures = {
  canUseAdvancedFilters?: boolean;
  canUnlockContacts?: boolean;
  canFavorite?: boolean;
  canSendTips?: boolean;
  canViewContacts?: boolean;
  canUseAlerts?: boolean;
  canUseTalentBank?: boolean;
  canExportProfiles?: boolean;
  canViewDashboardStats?: boolean;
  canContactRecruta?: boolean;
};

export type AlertWithMatches = CompanyAlert & {
  newMatches: Array<{ profileId: string; score: number; nome?: string; cargo?: string }>;
};

export type EntrevistaAgendada = {
  proposalId: string;
  profileId: string;
  professionalName: string;
  cargo: string;
  scheduledAt: string;
  interviewStatus: string;
};

export type CompanyChromeProfile = {
  razaoSocial: string;
  cnpj: string | null;
  responsavelNome: string | null;
  responsavelCpf: string | null;
  telefone: string | null;
  endereco: string | null;
  emailCorporativo: string | null;
  logoUrl?: string | null;
  fotoResponsavelUrl?: string | null;
  email: string;
};

type CacheSlice =
  | "planFeatures"
  | "alerts"
  | "talentLists"
  | "entrevistas";

type DashData = {
  planFeatures: CompanyPlanFeatures;
  planTier: string | null;
  planReady: boolean;
  unlockedCount: number;
  maxUnlocks: number | null;
  slotsRestantes: number | null;
  isOwner: boolean;
  companyVerified: boolean;
  companyProfile: CompanyChromeProfile | null;
  alerts: AlertWithMatches[];
  talentLists: TalentListDetalhada[];
  entrevistas: EntrevistaAgendada[];
};

type Ctx = DashData & {
  ensureTabData: (tab: CompanyDashboardTabId) => Promise<void>;
  refreshTabData: (tab: CompanyDashboardTabId) => Promise<void>;
  hasTabData: (tab: CompanyDashboardTabId) => boolean;
  ensureChrome: () => Promise<void>;
  refreshChrome: () => Promise<void>;
  getBadges: () => { entrevistas: number; alertas: number };
};

const EMPTY: DashData = {
  planFeatures: {},
  planTier: null,
  planReady: false,
  unlockedCount: 0,
  maxUnlocks: null,
  slotsRestantes: null,
  isOwner: true,
  companyVerified: false,
  companyProfile: null,
  alerts: [],
  talentLists: [],
  entrevistas: [],
};

const CompanyDashboardDataContext = createContext<Ctx | null>(null);

const TAB_SLICES: Record<CompanyDashboardTabId, CacheSlice[]> = {
  entrevistas: ["entrevistas"],
  equipe: [],
  banco: ["planFeatures", "talentLists"],
  alertas: ["planFeatures", "alerts"],
  contato: ["planFeatures"],
  "meu-plano": ["planFeatures"],
};

function parseProfilePayload(data: Record<string, unknown>): Partial<DashData> | null {
  const plan = (data.plan && typeof data.plan === "object" ? data.plan : null) as {
    tier?: string;
    features?: CompanyPlanFeatures;
  } | null;
  const company = (data.company && typeof data.company === "object" ? data.company : null) as {
    razaoSocial?: string;
    cnpj?: string | null;
    responsavelNome?: string | null;
    responsavelCpf?: string | null;
    telefone?: string | null;
    endereco?: string | null;
    emailCorporativo?: string | null;
    logoUrl?: string | null;
    fotoResponsavelUrl?: string | null;
    email?: string;
  } | null;
  const team = (data.team && typeof data.team === "object" ? data.team : null) as {
    isOwner?: boolean;
  } | null;
  const verification = (data.verification && typeof data.verification === "object"
    ? data.verification
    : null) as { status?: string } | null;

  const rawTier = String(plan?.tier || data.planTier || "").trim().toUpperCase();
  if (!rawTier) return null;

  return {
    planFeatures: plan?.features || {},
    planTier: rawTier,
    planReady: true,
    unlockedCount: typeof data.unlockedCount === "number" ? data.unlockedCount : 0,
    maxUnlocks: data.maxUnlocks === undefined ? null : (data.maxUnlocks as number | null),
    slotsRestantes:
      data.slotsRestantes !== undefined
        ? (data.slotsRestantes as number | null)
        : data.slotsRemaining !== undefined
          ? (data.slotsRemaining as number | null)
          : null,
    isOwner: team?.isOwner !== false,
    companyVerified: verification?.status === "VERIFIED",
    companyProfile: company
      ? {
          razaoSocial: company.razaoSocial || "",
          cnpj: company.cnpj ?? null,
          responsavelNome: company.responsavelNome ?? null,
          responsavelCpf: company.responsavelCpf ?? null,
          telefone: company.telefone ?? null,
          endereco: company.endereco ?? null,
          emailCorporativo: company.emailCorporativo ?? null,
          logoUrl: company.logoUrl ?? null,
          fotoResponsavelUrl: company.fotoResponsavelUrl ?? null,
          email: company.email || "",
        }
      : null,
  };
}

async function fetchSlice(slice: CacheSlice): Promise<{ ok: boolean; patch: Partial<DashData> }> {
  if (slice === "planFeatures") {
    const res = await fetch("/api/company/profile", { credentials: "include" });
    if (!res.ok) return { ok: false, patch: {} };
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!data) return { ok: false, patch: {} };
    const patch = parseProfilePayload(data);
    if (!patch) return { ok: false, patch: {} };
    return { ok: true, patch };
  }
  if (slice === "alerts") {
    const res = await fetch("/api/company/alerts?matches=1", { credentials: "include" });
    if (!res.ok) return { ok: false, patch: {} };
    const data = await res.json();
    return { ok: true, patch: { alerts: data.alerts || [] } };
  }
  if (slice === "talentLists") {
    const res = await fetch("/api/company/talent-lists?include=profiles", { credentials: "include" });
    if (!res.ok) return { ok: false, patch: {} };
    const data = await res.json();
    return {
      ok: true,
      patch: {
        talentLists: (data.lists || []).map((l: TalentList & { profiles?: TalentListDetalhada["profiles"] }) => ({
          ...l,
          profiles: l.profiles || [],
        })),
      },
    };
  }
  if (slice === "entrevistas") {
    const res = await fetch("/api/company/proposals/scheduled", { credentials: "include" });
    if (!res.ok) return { ok: false, patch: {} };
    const data = await res.json();
    return { ok: true, patch: { entrevistas: data.interviews || [] } };
  }
  return { ok: true, patch: {} };
}

export function CompanyDashboardDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashData>(EMPTY);
  const loadedRef = useRef<Set<CacheSlice>>(new Set());
  const inflightRef = useRef<Map<CacheSlice, Promise<void>>>(new Map());

  const mergeSlice = useCallback(async (slice: CacheSlice, force: boolean) => {
    if (!force && loadedRef.current.has(slice)) return;
    const existing = inflightRef.current.get(slice);
    if (existing) {
      await existing;
      return;
    }
    const job = (async () => {
      try {
        const { ok, patch } = await fetchSlice(slice);
        if (ok) {
          setData((prev) => ({ ...prev, ...patch }));
          loadedRef.current.add(slice);
        } else if (force) {
          // Falha forçada: libera para tentar de novo
          loadedRef.current.delete(slice);
        }
      } finally {
        inflightRef.current.delete(slice);
      }
    })();
    inflightRef.current.set(slice, job);
    await job;
  }, []);

  const ensureSlices = useCallback(
    async (slices: CacheSlice[], force: boolean) => {
      await Promise.all(slices.map((s) => mergeSlice(s, force)));
    },
    [mergeSlice],
  );

  const ensureTabData = useCallback(
    async (tab: CompanyDashboardTabId) => {
      await ensureSlices(TAB_SLICES[tab], false);
    },
    [ensureSlices],
  );

  const refreshTabData = useCallback(
    async (tab: CompanyDashboardTabId) => {
      for (const s of TAB_SLICES[tab]) loadedRef.current.delete(s);
      await ensureSlices(TAB_SLICES[tab], true);
    },
    [ensureSlices],
  );

  const hasTabData = useCallback((tab: CompanyDashboardTabId) => {
    return TAB_SLICES[tab].every((s) => loadedRef.current.has(s));
  }, []);

  const ensureChrome = useCallback(async () => {
    await ensureSlices(["planFeatures"], false);
  }, [ensureSlices]);

  /** Recarrega perfil/plano (após login ou quando o cache ficou vazio). */
  const refreshChrome = useCallback(async () => {
    loadedRef.current.delete("planFeatures");
    await ensureSlices(["planFeatures"], true);
  }, [ensureSlices]);

  const getBadges = useCallback(() => {
    return {
      entrevistas: data.entrevistas.length,
      alertas: data.alerts.reduce((acc, a) => acc + (a.newMatches?.length || 0), 0),
    };
  }, [data.alerts, data.entrevistas.length]);

  const value = useMemo<Ctx>(
    () => ({
      ...data,
      ensureTabData,
      refreshTabData,
      hasTabData,
      ensureChrome,
      refreshChrome,
      getBadges,
    }),
    [data, ensureTabData, refreshTabData, hasTabData, ensureChrome, refreshChrome, getBadges],
  );

  return (
    <CompanyDashboardDataContext.Provider value={value}>
      {children}
    </CompanyDashboardDataContext.Provider>
  );
}

export function useCompanyDashboardData() {
  const ctx = useContext(CompanyDashboardDataContext);
  if (!ctx) {
    throw new Error("useCompanyDashboardData deve ser usado dentro de CompanyDashboardDataProvider");
  }
  return ctx;
}

export function useCompanyDashboardDataOptional() {
  return useContext(CompanyDashboardDataContext);
}
