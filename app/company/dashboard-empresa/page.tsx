/* 🔒 BLOQUEADO (06/07/2026) — não editar sem pedido explícito. Ver .cursor/rules/dashboard-page-lock.mdc */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CompanyPlanCards from "@/app/components/CompanyPlanCards";
import BandeiraFavoritoIcon from "@/app/components/BandeiraFavoritoIcon";
import CompanyExclusiveFeatures from "@/app/components/CompanyExclusiveFeatures";
import LogoRecruta from "@/app/components/LogoRecruta";
import {
  AlertsPanel,
  DashboardStatsBar,
  TalentBankPanel,
  type CompanyAlert,
  type DashboardStats,
  type TalentList,
} from "@/app/components/CompanyDashboardTools";
import {
  SEGMENTOS_INDUSTRIA,
  MAQUINAS_EQUIPAMENTOS,
  QUALIDADE_PROCESSOS,
  INFORMATICA_OPCOES,
} from "@/lib/professional-form-config";
import type { CompanyPlanTier } from "@/lib/company-premium-plans";
import { dedupeStrings } from "@/lib/company-profile-display";
import { avatarImageStyle } from "@/lib/theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import DashboardThemeToggle from "@/app/components/DashboardThemeToggle";
import "@/app/dashboard/dashboard-theme.css";
import {
  DASH,
  DashboardThemeShell,
  dashAside,
  dashCard,
  dashGhostBtn,
  dashHeader,
  dashInput,
  dashInnerBox,
  dashLabel,
  dashPlanAccent,
  dashPlanBox,
  dashSectionTitle,
  dashTag,
  compatBadgeStyle,
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
  email: string;
}

interface ProfissionalResumo {
  id: string;
  nome: string;
  cargo: string;
  area: string;
  local: string;
  escolaridade: string;
  turno: string;
  experiencia: string;
  recolocacao: string;
  avatar: string | null;
  bloqueado: boolean;
  unlocked?: boolean;
  favorito?: boolean;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  pretensaoSalarial?: string;
  mensagem?: string;
  habilidades?: string[];
  curriculoURL?: string | null;
  disponibilidadeContratacao?: string;
  ultimaAtualizacao?: string;
  compatibilidade?: number;
  profileCompletion?: number;
  segmentosIndustria?: string[];
  maquinasEquipamentos?: string[];
  qualidadeProcessos?: string[];
  informatica?: string[];
  certificacoes?: string[];
  idiomas?: string[];
  cursos?: string[];
  possuiCNH?: string;
  categoriaCNH?: string;
  aceitaViagens?: string;
  disponibilidadeMudanca?: string;
  empresas?: { nome: string; cargo: string }[];
  certificadosUrl?: string | null;
  visualizado?: boolean;
  emDestaque?: boolean;
}

interface PlanFeatures {
  canUseAdvancedFilters: boolean;
  canUnlockContacts: boolean;
  canFavorite: boolean;
  canSendTips: boolean;
  canViewContacts: boolean;
  canUseAlerts?: boolean;
  canUseTalentBank?: boolean;
  canExportProfiles?: boolean;
  canViewDashboardStats?: boolean;
}

interface Filtros {
  estado: string;
  cidade: string;
  area: string;
  cargo: string;
  escolaridade: string;
  turno: string;
  recolocacao: string;
  experiencia: string;
  pretensaoSalarial: string;
  segmentoIndustria: string;
  maquinaEquipamento: string;
  qualidadeProcesso: string;
  informatica: string;
  possuiCNH: string;
  aceitaViagens: string;
  disponibilidadeMudanca: string;
  cursoCertificacao: string;
}

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const AREAS = ["Automotivo","Aviação","Construção","Alimentos","Metalurgia","Química","Têxtil","Logística","Outro"];
const ESCOLARIDADES = ["Fundamental","Médio","Técnico","Superior","Pós-graduação"];
const TURNOS = ["Manhã","Tarde","Noite","Integral"];
const RECOLOCACOES = ["Sim","Não","Dependendo"];
const TEMPOS_EXPERIENCIA = ["Menos de 1 ano","1-2 anos","3-5 anos","6-10 anos","Mais de 10 anos"];

const dashboardFont: React.CSSProperties = {
  fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, "Segoe UI", sans-serif',
};

const tagStyle: React.CSSProperties = {
  ...dashTag,
};

const inputStyle: React.CSSProperties = {
  ...dashInput,
};

const filterFieldStyle: React.CSSProperties = {
  flex: "1 1 130px",
  minWidth: 120,
};

const SIM_NAO = ["Sim", "Não", "Dependendo"];

const EMPTY_FILTROS: Filtros = {
  estado: "", cidade: "", area: "", cargo: "", escolaridade: "", turno: "", recolocacao: "",
  experiencia: "", pretensaoSalarial: "", segmentoIndustria: "", maquinaEquipamento: "",
  qualidadeProcesso: "", informatica: "", possuiCNH: "", aceitaViagens: "",
  disponibilidadeMudanca: "", cursoCertificacao: "",
};

function TagList({ items, max = 4 }: { items?: string[]; max?: number }) {
  const list = dedupeStrings(items || []);
  if (!list.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
      {list.slice(0, max).map((h) => (
        <span key={h} style={tagStyle}>{h}</span>
      ))}
    </div>
  );
}

function LinhaDetalhe({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === "—") return null;
  return (
    <p style={{ margin: "3px 0", fontSize: 12, lineHeight: 1.5, color: DASH.text }}>
      <span style={{ color: DASH.muted, fontWeight: 600 }}>{label}: </span>
      {value}
    </p>
  );
}

function SecaoTags({
  titulo,
  items,
  trailing,
}: {
  titulo: string;
  items?: string[];
  trailing?: React.ReactNode;
}) {
  const list = dedupeStrings(items || []);
  if (!list.length && !trailing) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: list.length ? 4 : 0 }}>
        <p style={{ margin: 0, color: DASH.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{titulo}</p>
        {trailing}
      </div>
      {list.length > 0 && <TagList items={list} max={12} />}
    </div>
  );
}

function CardPerfil({
  p,
  variant = "compact",
  onOpen,
  onUnlock,
  unlocking,
  canUnlock,
  canFavorite,
  canExport,
  canTalentBank,
  talentListId,
  onFavorite,
  onExport,
  onAddToList,
}: {
  p: ProfissionalResumo;
  variant?: "compact" | "full";
  onOpen?: () => void;
  onUnlock?: () => void;
  unlocking?: boolean;
  canUnlock?: boolean;
  canFavorite?: boolean;
  canExport?: boolean;
  canTalentBank?: boolean;
  talentListId?: string;
  onFavorite?: () => void;
  onExport?: () => void;
  onAddToList?: () => void;
}) {
  const cursos = dedupeStrings(p.cursos || []);
  const certificacoes = dedupeStrings(p.certificacoes || []);
  const idiomas = dedupeStrings(p.idiomas || []);
  const isFull = variant === "full";
  const avatarSize = isFull ? 80 : 56;
  const btnCard = { ...btnGold, padding: "6px 10px", fontSize: 10 } as const;

  const stopCardClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const badgeBase = {
    background: DASH.gold,
    color: "#000",
    fontSize: 9,
    padding: "3px 8px",
    borderRadius: 6,
    fontWeight: 800,
    border: "1px solid #000",
    boxShadow: "0 2px 0 #5a4512",
    whiteSpace: "nowrap" as const,
  };

  const badgesTopo = (
    <div
      style={{
        position: "absolute",
        top: isFull ? 16 : 10,
        right: isFull ? 16 : 10,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 6,
        zIndex: 5,
        maxWidth: "calc(100% - 20px)",
      }}
    >
      {typeof p.compatibilidade === "number" && (
        <span style={compatBadgeStyle(p.compatibilidade, !isFull)}>
          🎯 {p.compatibilidade}%
        </span>
      )}
      {p.visualizado && !p.bloqueado && (
        <span style={badgeBase}>Perfil visualizado</span>
      )}
      {canFavorite && onFavorite && (
        <button
          type="button"
          onClick={(e) => {
            stopCardClick(e);
            onFavorite();
          }}
          title={p.favorito ? "Remover dos favoritos" : "Marcar como favorito"}
          aria-label={p.favorito ? "Remover dos favoritos" : "Marcar como favorito"}
          aria-pressed={p.favorito}
          style={{
            background: "none",
            border: "none",
            outline: "none",
            padding: 0,
            margin: 0,
            cursor: "pointer",
            lineHeight: 0,
            color: p.favorito ? "#e53935" : "rgba(255,255,255,0.55)",
            flexShrink: 0,
          }}
        >
          <BandeiraFavoritoIcon ativo={!!p.favorito} size={22} />
        </button>
      )}
    </div>
  );

  const temBadgesTopo =
    typeof p.compatibilidade === "number" ||
    (p.visualizado && !p.bloqueado) ||
    (canFavorite && !!onFavorite);

  const detalhesCompletos = (
    <div style={{
      marginTop: isFull ? 20 : 10,
      fontSize: isFull ? 13 : 11,
      color: DASH.text,
      lineHeight: 1.6,
      ...(isFull ? {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
      } : {}),
    }}>
      <div>
        <LinhaDetalhe label="E-mail" value={p.email} />
        <LinhaDetalhe label="Telefone" value={p.telefone} />
        <LinhaDetalhe label="WhatsApp" value={p.whatsapp} />
        <LinhaDetalhe label="Disponibilidade" value={p.disponibilidadeContratacao} />
        <LinhaDetalhe label="Mudança" value={p.disponibilidadeMudanca} />
        <LinhaDetalhe label="CNH" value={p.possuiCNH && p.possuiCNH !== "—" ? `${p.possuiCNH}${p.categoriaCNH ? ` (${p.categoriaCNH})` : ""}` : undefined} />
        <LinhaDetalhe label="Viagens" value={p.aceitaViagens} />
        <LinhaDetalhe label="Pretensão salarial" value={p.pretensaoSalarial} />
        <LinhaDetalhe label="Recolocação" value={p.recolocacao} />
      </div>
      <div>
        <SecaoTags titulo="Segmentos" items={p.segmentosIndustria} />
        <SecaoTags titulo="Equipamentos" items={p.maquinasEquipamentos} />
        <SecaoTags titulo="Qualidade" items={p.qualidadeProcessos} />
        <SecaoTags titulo="Informática" items={p.informatica} />
        <SecaoTags titulo="Habilidades" items={p.habilidades} />
        <LinhaDetalhe label="Cursos" value={cursos.length ? cursos.join(", ") : undefined} />
        <LinhaDetalhe label="Certificações" value={certificacoes.length ? certificacoes.join(", ") : undefined} />
        <LinhaDetalhe label="Idiomas" value={idiomas.length ? idiomas.join(", ") : undefined} />
      </div>

      {p.mensagem && p.mensagem !== "—" && (
        <div style={{ gridColumn: isFull ? "1 / -1" : undefined, marginTop: isFull ? 4 : 8 }}>
          <p style={{ margin: "0 0 6px", color: DASH.muted, fontSize: isFull ? 12 : 11, fontWeight: 700, textTransform: "uppercase" }}>
            Apresentação para empresas
          </p>
          <p style={{ margin: 0, fontSize: isFull ? 14 : 12, lineHeight: 1.65, color: DASH.text, whiteSpace: "pre-wrap" }}>
            {p.mensagem}
          </p>
        </div>
      )}

      {p.empresas && p.empresas.length > 0 && (
        <div style={{ gridColumn: isFull ? "1 / -1" : undefined, marginTop: isFull ? 4 : 8 }}>
          <p style={{ margin: "0 0 6px", color: DASH.muted, fontSize: isFull ? 12 : 10, fontWeight: 700, textTransform: "uppercase" }}>Experiências</p>
          {p.empresas.map((e, i) => (
            <p key={`${e.nome}-${e.cargo}-${i}`} style={{ margin: "0 0 4px", fontSize: isFull ? 13 : 11 }}>
              • {e.cargo} — {e.nome}
            </p>
          ))}
        </div>
      )}

      <div style={{ gridColumn: isFull ? "1 / -1" : undefined }}>
        {p.ultimaAtualizacao && (
          <p style={{ margin: "8px 0 0", fontSize: isFull ? 12 : 10, color: "#999" }}>
            Atualizado: {new Date(p.ultimaAtualizacao).toLocaleDateString("pt-BR")}
          </p>
        )}
        {p.curriculoURL && (
          <a href={p.curriculoURL} target="_blank" rel="noreferrer" style={{ color: DASH.text, fontSize: isFull ? 13 : 11, display: "inline-block", marginTop: 8, textDecoration: "underline" }}>
            📄 Ver currículo
          </a>
        )}
        {p.certificadosUrl && (
          <a href={p.certificadosUrl} target="_blank" rel="noreferrer" style={{ color: DASH.text, fontSize: isFull ? 13 : 11, display: "block", marginTop: 6, textDecoration: "underline" }}>
            📎 Certificados anexos
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div
      role={onOpen && !isFull ? "button" : undefined}
      tabIndex={onOpen && !isFull ? 0 : undefined}
      onClick={onOpen && !isFull ? onOpen : undefined}
      onKeyDown={onOpen && !isFull ? (e) => { if (e.key === "Enter" || e.key === " ") onOpen(); } : undefined}
      style={{
      backgroundColor: DASH.card,
      border: `1px solid ${p.emDestaque ? DASH.gold : DASH.gold}`,
      borderRadius: isFull ? 14 : 10,
      padding: isFull ? 24 : 14,
      opacity: p.bloqueado ? 0.85 : 1,
      position: "relative",
      cursor: onOpen && !isFull ? "pointer" : "default",
      boxShadow: p.emDestaque
        ? "inset 0 1px 0 rgba(255, 228, 150, 0.25), 0 0 0 1px rgba(200, 155, 60, 0.45), 0 4px 14px rgba(200, 155, 60, 0.2)"
        : "inset 0 1px 0 rgba(255, 228, 150, 0.12), 0 2px 8px rgba(0, 0, 0, 0.25)",
      ...dashboardFont,
    }}>
      {badgesTopo}
      {p.emDestaque && (
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: DASH.gold,
            color: "#000",
            fontSize: 9,
            padding: "3px 8px",
            borderRadius: 6,
            fontWeight: 800,
            border: "1px solid #000",
            zIndex: 2,
            boxShadow: "0 2px 0 #5a4512",
          }}
        >
          ⭐ Destaque
        </span>
      )}
      <div style={{
        display: "flex",
        gap: isFull ? 18 : 12,
        alignItems: "flex-start",
        paddingTop: temBadgesTopo ? (isFull ? 36 : 30) : p.emDestaque ? 24 : 0,
      }}>
        {p.avatar ? (
          <img
            src={p.avatar}
            alt=""
            style={{
              ...avatarImageStyle(avatarSize),
              filter: p.bloqueado ? "blur(3px)" : "none",
              flexShrink: 0,
            }}
            decoding="async"
          />
        ) : (
          <div style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            background: DASH.inner,
            border: `2px solid ${DASH.gold}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isFull ? 28 : 20,
            flexShrink: 0,
          }}>👤</div>
        )}
        <div style={{ flex: 1, minWidth: 0, paddingRight: isFull ? 40 : 0 }}>
          <p style={{ color: DASH.text, margin: "0 0 6px", fontWeight: "bold", fontSize: isFull ? 22 : 14 }}>{p.nome}</p>
          <p style={{ color: DASH.text, margin: "0 0 4px", fontSize: isFull ? 15 : 12 }}>{p.cargo} · {p.area}</p>
          <p style={{ color: "#bbb", margin: 0, fontSize: isFull ? 13 : 11 }}>{p.local} · {p.escolaridade} · {p.turno}</p>
          <p style={{ color: "#999", margin: "6px 0 0", fontSize: isFull ? 13 : 11 }}>
            Exp: {p.experiencia}
            {!p.bloqueado && p.pretensaoSalarial && p.pretensaoSalarial !== "—" ? ` · ${p.pretensaoSalarial}` : ""}
          </p>
        </div>
      </div>

      {p.bloqueado && (
        <>
          <SecaoTags titulo="Segmentos" items={p.segmentosIndustria} />
          <SecaoTags titulo="Equipamentos" items={p.maquinasEquipamentos?.slice(0, isFull ? 12 : 3)} />
          {!isFull && (
            <p style={{ margin: "10px 0 0", fontSize: 11, color: DASH.muted, fontWeight: 600 }}>
              Clique para ver o perfil e liberar contato →
            </p>
          )}
        </>
      )}

      {!p.bloqueado && !isFull && (
        <div style={{ marginTop: 10 }}>
          <SecaoTags titulo="Segmentos" items={p.segmentosIndustria?.slice(0, 3)} />
          <p style={{ margin: "10px 0 0", fontSize: 11, color: DASH.muted, fontWeight: 600 }}>
            Clique para ver o perfil completo →
          </p>
        </div>
      )}

      {!p.bloqueado && isFull && detalhesCompletos}

      <div style={{ display: "flex", gap: 6, marginTop: isFull ? 16 : 10, flexWrap: "wrap" }} onClick={stopCardClick}>
        {canExport && onExport && !p.bloqueado && (
          <button type="button" onClick={onExport} style={btnCard}>
            📄 Exportar
          </button>
        )}
        {canTalentBank && onAddToList && !p.bloqueado && talentListId && (
          <button type="button" onClick={onAddToList} style={btnCard}>
            📁 + Lista
          </button>
        )}
      </div>

      {p.bloqueado && (
        <span style={{ position: "absolute", top: 10, left: 10, background: DASH.compatLow, color: DASH.compatLowText, fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: "bold" }}>
          🔒 BLOQUEADO
        </span>
      )}

      {p.bloqueado && canUnlock && onUnlock && (
        <button
          onClick={(e) => { stopCardClick(e); onUnlock(); }}
          disabled={unlocking}
          style={{ ...btnGold, width: "100%", marginTop: 10, padding: isFull ? "10px" : "8px", fontSize: isFull ? 13 : 11, opacity: unlocking ? 0.6 : 1 }}
        >
          {unlocking ? "Desbloqueando..." : "🔓 Liberar contato"}
        </button>
      )}

      {p.bloqueado && !canUnlock && (
        <p style={{ marginTop: 10, fontSize: 10, ...dashPlanAccent, textAlign: "center" }}>
          Upgrade para Basic para liberar contatos
        </p>
      )}
    </div>
  );
}

const PER_PAGE_PERFIS = 20;

type PaginacaoInfo = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

const PAGINACAO_INICIAL: PaginacaoInfo = {
  page: 1,
  perPage: PER_PAGE_PERFIS,
  total: 0,
  totalPages: 1,
};

function numerosDePagina(atual: number, total: number): number[] {
  if (total <= 1) return [1];
  const nums = new Set<number>([1, total, atual, atual - 1, atual + 1, atual - 2, atual + 2]);
  return [...nums].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
}

function BarraPaginacaoPerfis({
  paginacao,
  onPage,
  loading,
}: {
  paginacao: PaginacaoInfo;
  onPage: (page: number) => void;
  loading?: boolean;
}) {
  const { page, totalPages, total, perPage } = paginacao;
  if (total <= 0) return null;

  const nums = numerosDePagina(page, totalPages);
  const itens: Array<number | "ellipsis"> = [];
  nums.forEach((num, index) => {
    if (index > 0 && num - nums[index - 1] > 1) itens.push("ellipsis");
    itens.push(num);
  });

  const btnPagina = (ativo: boolean): React.CSSProperties => ({
    ...(ativo ? btnGold : {}),
    minWidth: 34,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 6,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.6 : 1,
    ...(ativo
      ? {}
      : {
          background: "transparent",
          color: DASH.text,
          border: `1px solid ${DASH.gold}`,
          boxShadow: "none",
        }),
  });

  return (
    <nav
      aria-label="Paginação de perfis"
      style={{
        ...dashCard,
        marginTop: 18,
        padding: "14px 16px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <button
        type="button"
        disabled={page <= 1 || loading || totalPages <= 1}
        onClick={() => onPage(page - 1)}
        style={btnPagina(false)}
      >
        ← Voltar
      </button>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", justifyContent: "center" }}>
        {itens.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} style={{ color: DASH.muted, fontSize: 12, padding: "0 2px" }}>
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              disabled={loading}
              onClick={() => onPage(item)}
              style={btnPagina(item === page)}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        disabled={page >= totalPages || loading || totalPages <= 1}
        onClick={() => onPage(page + 1)}
        style={btnPagina(false)}
      >
        Próximo →
      </button>

      <p style={{ width: "100%", margin: "8px 0 0", textAlign: "center", fontSize: 11, color: DASH.muted }}>
        Página {page} de {totalPages} · {total} profissional(is) encontrado(s)
      </p>
    </nav>
  );
}

export default function ClientDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [isCompanyAccount, setIsCompanyAccount] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [desbloqueados, setDesbloqueados] = useState<ProfissionalResumo[]>([]);
  const [profissionais, setProfissionais] = useState<ProfissionalResumo[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [maxUnlocks, setMaxUnlocks] = useState<number | null>(0);
  const [slotsRestantes, setSlotsRestantes] = useState<number | null>(0);
  const [planTier, setPlanTier] = useState<CompanyPlanTier>("FREE");
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
  });
  const [canUnlock, setCanUnlock] = useState(false);
  const [loadingProfissionais, setLoadingProfissionais] = useState(false);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [erroBusca, setErroBusca] = useState("");
  const [totalEncontrados, setTotalEncontrados] = useState(0);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<CompanyAlert[]>([]);
  const [talentLists, setTalentLists] = useState<TalentList[]>([]);
  const [selectedTalentListId, setSelectedTalentListId] = useState("");
  const [filtros, setFiltros] = useState<Filtros>(EMPTY_FILTROS);
  const [paginaPerfis, setPaginaPerfis] = useState(1);
  const [paginacao, setPaginacao] = useState<PaginacaoInfo>(PAGINACAO_INICIAL);
  const vitrinePerfisRef = React.useRef<HTMLElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === "unauthenticated" && mounted) {
      router.push("/login?redirect=/company/dashboard-empresa");
      return;
    }

    if (status === "authenticated" && mounted) {
      const userType = (session?.user as SessionUser | undefined)?.userType?.toUpperCase();
      if (userType === "PROFESSIONAL") {
        router.replace("/company/register");
      }
    }
  }, [status, router, mounted, session]);

  const checkRegistrationStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/company/check-registration");
      if (!response.ok) { setIsCheckingRegistration(false); return; }
      const data = await response.json();
      setIsCompanyAccount(data.isCompany === true);
      setRegistrationComplete(data.registrationComplete || false);
    } catch (error) {
      console.error("Erro ao verificar registro:", error);
    } finally {
      setIsCheckingRegistration(false);
    }
  }, []);

  const carregarPerfilEmpresa = useCallback(async () => {
    try {
      setProfileLoadError("");
      const res = await fetch("/api/company/profile", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCompanyProfile(data.company);
        setUnlockedCount(data.unlockedCount || 0);
        setMaxUnlocks(data.maxUnlocks ?? null);
        setSlotsRestantes(data.slotsRestantes ?? null);
        if (data.plan) {
          setPlanTier(data.plan.tier || "FREE");
          setPlanFeatures(data.plan.features || planFeatures);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setProfileLoadError(data.error || "Não foi possível carregar o perfil da empresa.");
      }
    } catch (e) {
      console.error(e);
      setProfileLoadError("Erro de rede ao carregar o perfil da empresa.");
    }
  }, []);

  const buscarProfissionais = useCallback(async (page: number) => {
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
      setUnlockedCount(data.unlockedCount || 0);
      setMaxUnlocks(data.maxUnlocks ?? null);
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

  const irParaPagina = useCallback((page: number) => {
    void buscarProfissionais(page);
    vitrinePerfisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [buscarProfissionais]);

  const carregarStats = useCallback(async () => {
    try {
      const res = await fetch("/api/company/dashboard-stats", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data.stats);
      }
    } catch { /* opcional */ }
  }, []);

  const carregarAlertas = useCallback(async () => {
    try {
      const res = await fetch("/api/company/alerts", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch { /* opcional */ }
  }, []);

  const carregarTalentLists = useCallback(async () => {
    try {
      const res = await fetch("/api/company/talent-lists", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTalentLists(data.lists || []);
      }
    } catch { /* opcional */ }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && mounted) {
      checkRegistrationStatus();
    }
  }, [status, mounted, checkRegistrationStatus]);

  useEffect(() => {
    if (!mounted || isCheckingRegistration || status !== "authenticated") return;
    if (!isCompanyAccount) {
      router.replace("/professional/dashboard");
    }
  }, [mounted, isCheckingRegistration, isCompanyAccount, status, router]);

  useEffect(() => {
    if (registrationComplete && status === "authenticated") {
      carregarPerfilEmpresa();
      buscarProfissionais(1);
      carregarStats();
      carregarAlertas();
      carregarTalentLists();
    }
  }, [registrationComplete, status, carregarPerfilEmpresa, buscarProfissionais, carregarStats, carregarAlertas, carregarTalentLists]);

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

  const patchFavoritoLocal = useCallback((profileId: string, favorito: boolean) => {
    setProfissionais((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, favorito } : p))
    );
    setDesbloqueados((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, favorito } : p))
    );
  }, []);

  const handleFavorite = async (profileId: string, favorito: boolean) => {
    const proximo = !favorito;
    patchFavoritoLocal(profileId, proximo);

    try {
      if (favorito) {
        const res = await fetch(`/api/company/favorites?profileId=${profileId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) {
          patchFavoritoLocal(profileId, favorito);
          const data = await res.json().catch(() => ({}));
          alert(data.error || "Erro ao remover favorito");
        }
        return;
      }

      const res = await fetch("/api/company/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId }),
      });
      const data = await res.json();
      if (!res.ok) {
        patchFavoritoLocal(profileId, favorito);
        alert(data.error || "Erro ao favoritar");
      }
    } catch {
      patchFavoritoLocal(profileId, favorito);
      alert("Erro ao atualizar favorito");
    }
  };

  const handleCreateAlert = async () => {
    const name = window.prompt("Nome do alerta (ex: Operadores CNC SP):");
    if (!name?.trim()) return;
    const res = await fetch("/api/company/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: name.trim(), filters: filtros }),
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

  const handleCreateTalentList = async () => {
    const name = window.prompt("Nome da lista (ex: Qualidade):");
    if (!name?.trim()) return;
    const res = await fetch("/api/company/talent-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "createList", name: name.trim() }),
    });
    if (res.ok) {
      await carregarTalentLists();
      const data = await res.json();
      if (data.id) setSelectedTalentListId(data.id);
    } else alert((await res.json()).error || "Erro ao criar lista");
  };

  const handleAddToTalentList = async (profileId: string) => {
    if (!selectedTalentListId) {
      alert("Selecione uma lista no painel lateral.");
      return;
    }
    const res = await fetch("/api/company/talent-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "addProfile", listId: selectedTalentListId, profileId }),
    });
    if (res.ok) {
      await carregarTalentLists();
      alert("Profissional adicionado à lista.");
    } else alert((await res.json()).error || "Erro ao adicionar à lista");
  };

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

  const handleLogout = () => { window.location.href = "/api/auth/logout"; };

  const openProfile = (profileId: string) => {
    router.push(`/company/professional/${profileId}`);
  };

  const advancedFilterDisabled = !planFeatures.canUseAdvancedFilters;
  const maxUnlocksLabel = maxUnlocks === null ? "∞" : String(maxUnlocks);
  const slotsLabel = slotsRestantes === null ? "∞" : String(slotsRestantes);

  const user = session?.user as SessionUser | undefined;

  if (status === "loading" || isCheckingRegistration) {
    return (
      <DashboardThemeShell>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 18, color: DASH.text }}>Carregando...</p>
        </div>
      </DashboardThemeShell>
    );
  }

  if (!user) return null;

  if (!registrationComplete && isCompanyAccount) {
    return (
      <DashboardThemeShell>
        <header style={{ ...dashHeader, padding: "20px 40px" }}>
          <h1 style={{ margin: 0, ...dashSectionTitle, fontSize: 22 }}>Dashboard Empresa</h1>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <DashboardThemeToggle />
            <button onClick={handleLogout} style={{ ...btnGold, padding: "10px 20px" }}>Sair</button>
          </div>
        </header>
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div style={{ maxWidth: 560, ...dashCard, padding: 40, borderRadius: 16, textAlign: "center" }}>
            <h2 style={dashSectionTitle}>Cadastro incompleto</h2>
            <p style={{ color: DASH.text }}>Complete CNPJ, razão social, nome e CPF do responsável para acessar a vitrine.</p>
            <button onClick={() => router.push("/company/register")} style={{ ...btnGold, padding: "14px 32px", fontSize: 15, marginTop: 10 }}>
              Completar cadastro
            </button>
          </div>
        </main>
      </DashboardThemeShell>
    );
  }

  return (
    <DashboardThemeShell>
      <header style={dashHeader}>
        <LogoRecruta size="xs" as="h1" depth />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 11, ...dashPlanAccent }}>
            Plano {planTier} · Liberações: {unlockedCount}/{maxUnlocksLabel}
          </span>
          <DashboardThemeToggle />
          <button onClick={() => router.push("/company/register")} style={{ ...btnGold, padding: "8px 14px", fontSize: 11 }}>Editar cadastro</button>
          <button onClick={handleLogout} style={{ ...btnGold, padding: "8px 14px", fontSize: 11 }}>Sair</button>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 300px) minmax(0, 1fr)", gap: 0, minHeight: "calc(100vh - 65px)" }}>
        <aside style={dashAside}>
          <h3 style={{ ...dashSectionTitle, margin: "0 0 12px", fontSize: 14 }}>🏢 Perfil da Empresa</h3>
          {companyProfile ? (
            <div style={{ fontSize: 11, lineHeight: 1.6 }}>
              {[
                ["Razão social", companyProfile.razaoSocial],
                ["CNPJ", companyProfile.cnpj],
                ["Responsável", companyProfile.responsavelNome],
                ["CPF", companyProfile.responsavelCpf],
                ["E-mail", companyProfile.email],
              ].map(([label, val]) => (
                <div key={String(label)} style={{ marginBottom: 8, padding: "6px 8px", ...dashInnerBox }}>
                  <p style={{ ...dashLabel, margin: "0 0 2px", fontSize: 10, textTransform: "uppercase" }}>{label}</p>
                  <p style={{ color: DASH.text, margin: 0, fontSize: 12, wordBreak: "break-word" }}>{val || "—"}</p>
                </div>
              ))}
              <div style={{ marginTop: 12, ...dashPlanBox }}>
                <p style={{ ...dashPlanAccent, margin: "0 0 4px", fontSize: 10, fontWeight: "bold" }}>Plano atual</p>
                <p style={{ ...dashPlanAccent, margin: 0, fontSize: 16, fontWeight: "bold" }}>{planTier}</p>
                <p style={{ color: DASH.muted, margin: "8px 0 0", fontSize: 11 }}>
                  Liberações restantes: {slotsLabel}
                </p>
              </div>
            </div>
          ) : profileLoadError ? (
            <p style={{ fontSize: 11, color: "#dc3545" }}>{profileLoadError}</p>
          ) : (
            <p style={{ fontSize: 11, color: DASH.muted }}>Carregando perfil...</p>
          )}

          {planFeatures.canUseAlerts && (
            <AlertsPanel
              alerts={alerts}
              onCreate={handleCreateAlert}
              onToggle={handleToggleAlert}
              onDelete={handleDeleteAlert}
            />
          )}
          {planFeatures.canUseTalentBank && (
            <TalentBankPanel
              lists={talentLists}
              onAddList={handleCreateTalentList}
              selectedListId={selectedTalentListId}
              onSelectList={setSelectedTalentListId}
            />
          )}

          <CompanyExclusiveFeatures />
        </aside>

        {/* Filtros horizontais + vitrine */}
        <main data-company-main style={{ padding: "20px 24px", overflowY: "auto", minWidth: 0 }}>
          {planFeatures.canViewDashboardStats && dashboardStats && (
            <>
              <h3 style={{ ...dashSectionTitle, margin: "0 0 10px", fontSize: 14 }}>📊 Dashboard de recrutamento</h3>
              <DashboardStatsBar stats={dashboardStats} />
            </>
          )}
          <section style={{ marginBottom: 20 }}>
            <h3 style={{ ...dashSectionTitle, margin: "0 0 10px", fontSize: 14 }}>🔍 Filtros de busca</h3>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "flex-end",
              padding: 12,
              ...dashCard,
            }}>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Estado</label>
                <select value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })} style={inputStyle}>
                  <option value="">UF</option>
                  {ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Cidade</label>
                <input placeholder="Cidade" value={filtros.cidade} onChange={(e) => setFiltros({ ...filtros, cidade: e.target.value })} style={inputStyle} />
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Área</label>
                <select value={filtros.area} onChange={(e) => setFiltros({ ...filtros, area: e.target.value })} style={inputStyle}>
                  <option value="">Área</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Cargo</label>
                <input placeholder="Cargo desejado" value={filtros.cargo} onChange={(e) => setFiltros({ ...filtros, cargo: e.target.value })} style={inputStyle} />
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Escolaridade {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.escolaridade} onChange={(e) => setFiltros({ ...filtros, escolaridade: e.target.value })} style={{ ...inputStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Escolaridade</option>
                  {ESCOLARIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Turno {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.turno} onChange={(e) => setFiltros({ ...filtros, turno: e.target.value })} style={{ ...inputStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Turno</option>
                  {TURNOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Recolocação {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.recolocacao} onChange={(e) => setFiltros({ ...filtros, recolocacao: e.target.value })} style={{ ...inputStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Recolocação</option>
                  {RECOLOCACOES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Experiência {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.experiencia} onChange={(e) => setFiltros({ ...filtros, experiencia: e.target.value })} style={{ ...inputStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Tempo exp.</option>
                  {TEMPOS_EXPERIENCIA.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Pretensão salarial {advancedFilterDisabled && "🔒"}</label>
                <input
                  disabled={advancedFilterDisabled}
                  placeholder="Ex: 3500 ou R$ 3.500"
                  value={filtros.pretensaoSalarial}
                  onChange={(e) => setFiltros({ ...filtros, pretensaoSalarial: e.target.value })}
                  style={{ ...inputStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}
                />
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Segmento {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.segmentoIndustria} onChange={(e) => setFiltros({ ...filtros, segmentoIndustria: e.target.value })} style={{ ...inputStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Segmento</option>
                  {SEGMENTOS_INDUSTRIA.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Máquina {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.maquinaEquipamento} onChange={(e) => setFiltros({ ...filtros, maquinaEquipamento: e.target.value })} style={{ ...inputStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Equipamento</option>
                  {MAQUINAS_EQUIPAMENTOS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Qualidade {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.qualidadeProcesso} onChange={(e) => setFiltros({ ...filtros, qualidadeProcesso: e.target.value })} style={{ ...inputStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Qualidade</option>
                  {QUALIDADE_PROCESSOS.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Informática/ERP {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.informatica} onChange={(e) => setFiltros({ ...filtros, informatica: e.target.value })} style={{ ...inputStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Sistema</option>
                  {INFORMATICA_OPCOES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>CNH {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.possuiCNH} onChange={(e) => setFiltros({ ...filtros, possuiCNH: e.target.value })} style={{ ...inputStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">CNH</option>
                  {SIM_NAO.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Viagens {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.aceitaViagens} onChange={(e) => setFiltros({ ...filtros, aceitaViagens: e.target.value })} style={{ ...inputStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Viagens</option>
                  {SIM_NAO.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Mudança {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.disponibilidadeMudanca} onChange={(e) => setFiltros({ ...filtros, disponibilidadeMudanca: e.target.value })} style={{ ...inputStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Mudança</option>
                  {SIM_NAO.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Curso/Cert. {advancedFilterDisabled && "🔒"}</label>
                <input disabled={advancedFilterDisabled} placeholder="Ex: NR-12" value={filtros.cursoCertificacao} onChange={(e) => setFiltros({ ...filtros, cursoCertificacao: e.target.value })} style={{ ...inputStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }} />
              </div>
              {advancedFilterDisabled && (
                <p style={{ width: "100%", margin: 0, fontSize: 10, color: DASH.muted }}>
                  Filtros avançados disponíveis a partir do plano <span style={dashPlanAccent}>Basic</span>.
                </p>
              )}
              <button
                onClick={() => {
                  setPaginaPerfis(1);
                  void buscarProfissionais(1);
                }}
                disabled={loadingProfissionais}
                style={{ ...btnGold, padding: "8px 16px", fontSize: 12, flex: "0 0 auto", opacity: loadingProfissionais ? 0.7 : 1 }}
              >
                {loadingProfissionais ? "Buscando..." : "Buscar"}
              </button>
              <button
                onClick={() => setFiltros(EMPTY_FILTROS)}
                style={{
                  ...dashGhostBtn,
                  padding: "8px 12px",
                  fontSize: 11,
                  flex: "0 0 auto",
                }}
              >
                Limpar
              </button>
            </div>
          </section>

          {erroBusca && (
            <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 12 }}>
              {erroBusca}
            </div>
          )}

          {totalEncontrados > 0 && (
            <p style={{ color: DASH.muted, fontSize: 11, margin: "0 0 16px" }}>
              {totalEncontrados} profissional(is) compatível(is)
              {desbloqueados.length > 0 ? ` · ${desbloqueados.length} desbloqueado(s)` : ""}
              {paginacao.totalPages > 1 ? ` · página ${paginacao.page} de ${paginacao.totalPages}` : ""}
              {" "}— ordenados por índice de compatibilidade.
            </p>
          )}

          <section ref={vitrinePerfisRef} style={{ marginBottom: 28 }}>
            <h2 style={{ ...dashSectionTitle, margin: "0 0 4px", fontSize: 16 }}>
              👥 Profissionais na vitrine ({paginacao.total || totalEncontrados})
            </h2>
            <p style={{ color: DASH.muted, margin: "0 0 14px", fontSize: 11 }}>
              Clique no card para ver o perfil. Perfis bloqueados exibem dados parciais até liberar o contato.
              {planFeatures.canUnlockContacts
                ? ` Liberações: ${unlockedCount}/${maxUnlocksLabel}.`
                : " Plano Free: contatos no Basic."}
              {canUnlock && slotsRestantes === 0 && " Limite de liberações atingido."}
            </p>
            {profissionais.length === 0 ? (
              <div style={{ padding: 20, ...dashCard, textAlign: "center", color: DASH.muted, fontSize: 12 }}>
                {loadingProfissionais
                  ? "Carregando profissionais..."
                  : "Nenhum profissional encontrado com estes filtros."}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {profissionais.map((p) => (
                  <CardPerfil
                    key={p.id}
                    p={p}
                    onOpen={() => openProfile(p.id)}
                    canUnlock={p.bloqueado && canUnlock && (slotsRestantes === null || slotsRestantes > 0)}
                    canFavorite={planFeatures.canFavorite}
                    canExport={planFeatures.canExportProfiles && !p.bloqueado}
                    canTalentBank={planFeatures.canUseTalentBank && !p.bloqueado}
                    talentListId={selectedTalentListId}
                    onUnlock={() => handleUnlock(p.id)}
                    onFavorite={() => handleFavorite(p.id, !!p.favorito)}
                    onExport={() => handleExportProfile(p.id)}
                    onAddToList={() => handleAddToTalentList(p.id)}
                    unlocking={unlockingId === p.id}
                  />
                ))}
              </div>
            )}

            <BarraPaginacaoPerfis
              paginacao={paginacao}
              onPage={irParaPagina}
              loading={loadingProfissionais}
            />
          </section>
        </main>
      </div>

      <div style={{ padding: "24px 24px 40px", borderTop: `1px solid ${DASH.border}` }}>
        <CompanyPlanCards currentTier={planTier} onSelectFree={handleSelectFreePlan} />
      </div>
    </DashboardThemeShell>
  );
}
