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
import {
  SEGMENTOS_INDUSTRIA,
  MAQUINAS_EQUIPAMENTOS,
  QUALIDADE_PROCESSOS,
  INFORMATICA_OPCOES,
  AREAS_INTERESSE,
  AREAS_COMPLEMENTO_NIVEL,
  AREAS_CURSO,
  CNH_CATEGORIAS,
  ESCOLARIDADES_OPCOES,
  SITUACAO_PROFISSIONAL_OPCOES,
  NIVEIS_OPERACIONAIS,
  TURNOS_DISPONIVEIS,
  DISPONIBILIDADE_INICIO_OPCOES,
  DISPONIBILIDADE_MUDANCA_OPCOES,
  ACEITA_VIAGENS_OPCOES,
  POSSUI_CNH_OPCOES,
  TRABALHO_INDUSTRIA_OPCOES,
  TEMPOS_EXPERIENCIA_OPCOES,
  IDIOMAS_OPCOES,
  ESTADOS_BR,
  formatPretensaoSalarialInput,
} from "@/lib/professional-form-config";
import type { CompanyPlanTier } from "@/lib/company-premium-plans";
import type { CompanyVerificationStatus } from "@/lib/company/company-verification";
import { dedupeStrings } from "@/lib/company-profile-display";
import { avatarImageStyle } from "@/lib/theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import "@/app/dashboard/dashboard-theme.css";
import {
  DASH,
  dashCard,
  dashGhostBtn,
  dashInput,
  dashInnerBox,
  dashLabel,
  dashPlanAccent,
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
  telefone: string | null;
  endereco: string | null;
  emailCorporativo: string | null;
  emailCorporativoVerificado: boolean;
  logoUrl?: string | null;
  fotoResponsavelUrl?: string | null;
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
  canSendProposals?: boolean;
  canViewContacts: boolean;
  canUseAlerts?: boolean;
  canUseTalentBank?: boolean;
  canExportProfiles?: boolean;
  canViewDashboardStats?: boolean;
  canContactRecruta?: boolean;
}

interface Filtros {
  estado: string;
  cidade: string;
  disponibilidadeMudanca: string;
  aceitaViagens: string;
  escolaridade: string;
  area: string;
  situacaoProfissional: string;
  nivelOperacional: string;
  areaNivel: string;
  cargo: string;
  turno: string;
  disponibilidadeInicio: string;
  pretensaoSalarial: string;
  trabalhouIndustria: string;
  experiencia: string;
  segmentoIndustria: string;
  maquinaEquipamento: string;
  qualidadeProcesso: string;
  informatica: string;
  possuiCNH: string;
  categoriaCNH: string;
  cursoCertificacao: string;
  areaCurso: string;
  idioma: string;
}

const dashboardFont: React.CSSProperties = {
  fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, "Segoe UI", sans-serif',
};

const tagStyle: React.CSSProperties = {
  ...dashTag,
};

const filterFieldStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
};

const filterControlStyle: React.CSSProperties = {
  ...dashInput,
  width: "100%",
  boxSizing: "border-box",
};

const filtersGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
  gap: 8,
  alignItems: "end",
};

const filterActionsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
  justifyContent: "flex-end",
  marginTop: 10,
};

const EMPTY_FILTROS: Filtros = {
  estado: "",
  cidade: "",
  disponibilidadeMudanca: "",
  aceitaViagens: "",
  escolaridade: "",
  area: "",
  situacaoProfissional: "",
  nivelOperacional: "",
  areaNivel: "",
  cargo: "",
  turno: "",
  disponibilidadeInicio: "",
  pretensaoSalarial: "",
  trabalhouIndustria: "",
  experiencia: "",
  segmentoIndustria: "",
  maquinaEquipamento: "",
  qualidadeProcesso: "",
  informatica: "",
  possuiCNH: "",
  categoriaCNH: "",
  cursoCertificacao: "",
  areaCurso: "",
  idioma: "",
};

function filtrosTemValor(f: Filtros): boolean {
  return Object.values(f).some((v) => String(v).trim() !== "");
}

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
  canExport,
  onExport,
}: {
  p: ProfissionalResumo;
  variant?: "compact" | "full";
  onOpen?: () => void;
  onUnlock?: () => void;
  unlocking?: boolean;
  canUnlock?: boolean;
  canExport?: boolean;
  onExport?: () => void;
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
    </div>
  );

  const temBadgesTopo =
    typeof p.compatibilidade === "number" ||
    (p.visualizado && !p.bloqueado);

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
      data-card="1"
      className="dash-card"
      style={{
      backgroundColor: DASH.card,
      border: `1px solid ${DASH.gold}`,
      borderRadius: 16,
      overflow: "hidden",
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
            border: `1px solid ${DASH.gold}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isFull ? 28 : 20,
            flexShrink: 0,
          }}>👤</div>
        )}
        <div style={{ flex: 1, minWidth: 0, paddingRight: isFull ? 40 : 0 }}>
          <p style={{ color: DASH.gold, margin: "0 0 6px", fontWeight: "bold", fontSize: isFull ? 22 : 14 }}>{p.nome}</p>
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

const PER_PAGE_PERFIS = 12;

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
  const page = Math.max(1, paginacao.page || 1);
  const totalPages = Math.max(1, paginacao.totalPages || 1);
  const total = Math.max(0, paginacao.total || 0);

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
              disabled={loading || totalPages <= 1}
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
        Página {page} de {totalPages}
        {total > 0 ? ` · ${total} profissional(is) encontrado(s)` : ""}
      </p>
    </nav>
  );
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

          <div style={{ padding: "20px 24px", minWidth: 0 }}>
          {planFeatures.canViewDashboardStats && dashboardStats && (
            <>
              <h3 style={{ ...dashSectionTitle, margin: "0 0 10px", fontSize: 14 }}>📊 Dashboard de recrutamento</h3>
              <DashboardStatsBar stats={dashboardStats} />
            </>
          )}

          <section style={{ marginBottom: 20 }}>
            <h3 style={{ ...dashSectionTitle, margin: "0 0 10px", fontSize: 14 }}>🔍 Busca rápida</h3>
            <div data-card="1" className="dash-card" style={{ padding: 12, ...dashCard }}>
              <div style={filtersGridStyle}>
                <div style={filterFieldStyle}>
                  <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Cargo</label>
                  <input
                    placeholder="Ex.: Operador de CNC"
                    value={filtros.cargo}
                    onChange={(e) => setFiltros({ ...filtros, cargo: e.target.value })}
                    style={filterControlStyle}
                  />
                </div>
                <div style={filterFieldStyle}>
                  <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Estado</label>
                  <select
                    value={filtros.estado}
                    onChange={(e) => setFiltros({ ...filtros, estado: e.target.value, cidade: "" })}
                    style={filterControlStyle}
                  >
                    <option value="">Selecione</option>
                    {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div style={filterFieldStyle}>
                  <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Cidade</label>
                  <select
                    value={filtros.cidade}
                    disabled={!filtros.estado}
                    onChange={(e) => setFiltros({ ...filtros, cidade: e.target.value })}
                    style={{ ...filterControlStyle, opacity: filtros.estado ? 1 : 0.5 }}
                  >
                    <option value="">{filtros.estado ? "Selecione" : "Escolha o estado"}</option>
                    {cidadesOpcoes.map((cidade) => <option key={cidade} value={cidade}>{cidade}</option>)}
                  </select>
                </div>
                <div style={filterFieldStyle}>
                  <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Experiência</label>
                  <select
                    value={filtros.experiencia}
                    onChange={(e) => setFiltros({ ...filtros, experiencia: e.target.value })}
                    style={filterControlStyle}
                  >
                    <option value="">Selecione</option>
                    {TEMPOS_EXPERIENCIA_OPCOES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={filterFieldStyle}>
                  <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Turno</label>
                  <select
                    value={filtros.turno}
                    onChange={(e) => setFiltros({ ...filtros, turno: e.target.value })}
                    style={filterControlStyle}
                  >
                    <option value="">Selecione</option>
                    {TURNOS_DISPONIVEIS.map((t) => (
                      <option key={t} value={t}>
                        {t === "1º Turno" ? "Primeiro" : t === "2º Turno" ? "Segundo" : t === "3º Turno" ? "Terceiro" : t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ ...filterActionsStyle, justifyContent: "space-between" }}>
                <button
                  type="button"
                  onClick={() => setBuscaAvancadaAberta((v) => !v)}
                  style={{
                    ...dashGhostBtn,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    borderColor: buscaAvancadaAberta ? DASH.gold : undefined,
                    background: buscaAvancadaAberta ? "rgba(200,155,60,0.14)" : undefined,
                  }}
                >
                  {buscaAvancadaAberta ? "▲ Ocultar avançada" : "🔍 Busca Avançada"}
                </button>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => {
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
                    disabled={loadingProfissionais}
                    style={{ ...btnGold, padding: "8px 16px", fontSize: 12, opacity: loadingProfissionais ? 0.7 : 1 }}
                  >
                    {loadingProfissionais ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <AmpulhetaLoading compact label="Buscando..." size={16} color="#1a1a1a" />
                        Buscando...
                      </span>
                    ) : "Buscar"}
                  </button>
                  <button
                    onClick={() => {
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
                    style={{
                      ...dashGhostBtn,
                      padding: "8px 12px",
                      fontSize: 11,
                    }}
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {buscaAvancadaAberta && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${DASH.border}` }}>
                  <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: DASH.gold }}>
                    Busca avançada
                  </p>
                  {advancedFilterDisabled && (
                    <p style={{ margin: "0 0 10px", fontSize: 10, color: DASH.muted }}>
                      Filtros avançados disponíveis a partir do plano <span style={dashPlanAccent}>Basic</span>.
                    </p>
                  )}
                  <div style={filtersGridStyle}>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Área de interesse</label>
                      <select value={filtros.area} onChange={(e) => setFiltros({ ...filtros, area: e.target.value })} style={filterControlStyle}>
                        <option value="">Selecione</option>
                        {AREAS_INTERESSE.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Escolaridade (nível) {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled} value={filtros.escolaridade} onChange={(e) => setFiltros({ ...filtros, escolaridade: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {ESCOLARIDADES_OPCOES.map((e) => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Situação profissional {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled} value={filtros.situacaoProfissional} onChange={(e) => setFiltros({ ...filtros, situacaoProfissional: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {SITUACAO_PROFISSIONAL_OPCOES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Nível operacional {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled} value={filtros.nivelOperacional} onChange={(e) => setFiltros({ ...filtros, nivelOperacional: e.target.value, areaNivel: e.target.value ? filtros.areaNivel : "" })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {NIVEIS_OPERACIONAIS.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Área operacional {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled || !filtros.nivelOperacional} value={filtros.areaNivel} onChange={(e) => setFiltros({ ...filtros, areaNivel: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled || !filtros.nivelOperacional ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {AREAS_COMPLEMENTO_NIVEL.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Disponibilidade para início {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled} value={filtros.disponibilidadeInicio} onChange={(e) => setFiltros({ ...filtros, disponibilidadeInicio: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {DISPONIBILIDADE_INICIO_OPCOES.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Pretensão salarial {advancedFilterDisabled && "🔒"}</label>
                      <input
                        disabled={advancedFilterDisabled}
                        placeholder="R$ 0,00"
                        value={filtros.pretensaoSalarial}
                        onChange={(e) => setFiltros({
                          ...filtros,
                          pretensaoSalarial: formatPretensaoSalarialInput(e.target.value),
                        })}
                        style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}
                      />
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Trabalhou na indústria? {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled} value={filtros.trabalhouIndustria} onChange={(e) => setFiltros({ ...filtros, trabalhouIndustria: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {TRABALHO_INDUSTRIA_OPCOES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Segmento (experiência) {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled} value={filtros.segmentoIndustria} onChange={(e) => setFiltros({ ...filtros, segmentoIndustria: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {SEGMENTOS_INDUSTRIA.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Máquinas/equipamentos {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled} value={filtros.maquinaEquipamento} onChange={(e) => setFiltros({ ...filtros, maquinaEquipamento: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {MAQUINAS_EQUIPAMENTOS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Qualidade e processos {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled} value={filtros.qualidadeProcesso} onChange={(e) => setFiltros({ ...filtros, qualidadeProcesso: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {QUALIDADE_PROCESSOS.map((q) => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Informática/ERP {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled} value={filtros.informatica} onChange={(e) => setFiltros({ ...filtros, informatica: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {INFORMATICA_OPCOES.map((i) => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Possui CNH? {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled} value={filtros.possuiCNH} onChange={(e) => setFiltros({ ...filtros, possuiCNH: e.target.value, categoriaCNH: e.target.value === "Sim" ? filtros.categoriaCNH : "" })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {POSSUI_CNH_OPCOES.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Categoria CNH {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled || filtros.possuiCNH !== "Sim"} value={filtros.categoriaCNH} onChange={(e) => setFiltros({ ...filtros, categoriaCNH: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled || filtros.possuiCNH !== "Sim" ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {CNH_CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Curso/Certificação {advancedFilterDisabled && "🔒"}</label>
                      <input disabled={advancedFilterDisabled} placeholder="Ex: NR-12" value={filtros.cursoCertificacao} onChange={(e) => setFiltros({ ...filtros, cursoCertificacao: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }} />
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Área do curso {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled} value={filtros.areaCurso} onChange={(e) => setFiltros({ ...filtros, areaCurso: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {AREAS_CURSO.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Idioma {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled} value={filtros.idioma} onChange={(e) => setFiltros({ ...filtros, idioma: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {IDIOMAS_OPCOES.map((i) => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Disponibilidade para mudança {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled} value={filtros.disponibilidadeMudanca} onChange={(e) => setFiltros({ ...filtros, disponibilidadeMudanca: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {DISPONIBILIDADE_MUDANCA_OPCOES.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div style={filterFieldStyle}>
                      <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Disponibilidade para viagens {advancedFilterDisabled && "🔒"}</label>
                      <select disabled={advancedFilterDisabled} value={filtros.aceitaViagens} onChange={(e) => setFiltros({ ...filtros, aceitaViagens: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                        <option value="">Selecione</option>
                        {ACEITA_VIAGENS_OPCOES.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {erroBusca && (
            <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 12 }}>
              {erroBusca}
            </div>
          )}

          {buscaRealizada && totalEncontrados > 0 && (
            <p style={{ color: DASH.muted, fontSize: 11, margin: "0 0 12px" }}>
              {totalEncontrados} profissional(is) compatível(is)
              {desbloqueadosTotal > 0 ? ` · ${desbloqueadosTotal} desbloqueado(s)` : ""}
              {paginacao.totalPages > 1 ? ` · página ${paginacao.page} de ${paginacao.totalPages}` : ""}
              {" "}— ordenados por índice de compatibilidade.
            </p>
          )}

          <section ref={vitrinePerfisRef} style={{ marginBottom: 16 }}>
            <h2 style={{ ...dashSectionTitle, margin: "0 0 10px", fontSize: 16, color: DASH.gold }}>
              {vitrineListaNome
                ? `📁 Banco de talentos — ${vitrineListaNome}`
                : "👥 Profissionais na vitrine"}
              {buscaRealizada ? ` (${paginacao.total || totalEncontrados})` : ""}
            </h2>

            {!buscaRealizada || profissionais.length === 0 ? (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px dashed ${DASH.gold}`,
                  color: DASH.muted,
                  fontSize: 12,
                  fontWeight: 600,
                  opacity: 0.85,
                }}
              >
                {loadingProfissionais ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <AmpulhetaLoading compact label="Buscando..." size={16} color={DASH.gold} />
                    Buscando...
                  </span>
                ) : buscaRealizada ? (
                  "0 Resultados"
                ) : (
                  "Use a busca rápida acima para encontrar profissionais."
                )}
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 14,
                    alignContent: "start",
                  }}
                >
                  {profissionais.map((p) => (
                    <CardPerfil
                      key={p.id}
                      p={p}
                      onOpen={() => openProfile(p.id)}
                      canUnlock={p.bloqueado && canUnlock && (slotsRestantes === null || slotsRestantes > 0)}
                      canExport={planFeatures.canExportProfiles && !p.bloqueado}
                      onUnlock={() => handleUnlock(p.id)}
                      onExport={() => handleExportProfile(p.id)}
                      unlocking={unlockingId === p.id}
                    />
                  ))}
                </div>

                <BarraPaginacaoPerfis
                  paginacao={paginacao}
                  onPage={irParaPagina}
                  loading={loadingProfissionais}
                />
              </>
            )}
          </section>

          <section style={{ marginTop: 4, marginBottom: 12 }}>
            <CompanyPlanCards
              currentTier={planLoaded ? planTier : null}
              onSelectFree={handleSelectFreePlan}
            />
          </section>
          </div>
        </>
  );
}
