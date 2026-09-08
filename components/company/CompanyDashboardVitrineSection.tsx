/* 🔒 BLOQUEADO (06/07/2026) — não editar sem pedido explícito. Ver .cursor/rules/dashboard-page-lock.mdc */
"use client";

import React from "react";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import { dedupeStrings } from "@/lib/company-profile-display";
import { avatarImageStyle } from "@/lib/theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import {
  DASH,
  dashCard,
  dashPlanAccent,
  dashSectionTitle,
  dashTag,
  compatBadgeStyle,
} from "@/lib/dashboard-theme";

export interface ProfissionalResumo {
  id: string;
  /** Slug legível para URL (/company/profissional/...) */
  slug?: string;
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

export const PER_PAGE_PERFIS = 12;

export type PaginacaoInfo = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export const PAGINACAO_INICIAL: PaginacaoInfo = {
  page: 1,
  perPage: PER_PAGE_PERFIS,
  total: 0,
  totalPages: 1,
};

const dashboardFont: React.CSSProperties = {
  fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, "Segoe UI", sans-serif',
};

const tagStyle: React.CSSProperties = {
  ...dashTag,
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

export type CompanyDashboardVitrineSectionProps = {
  sectionRef?: React.RefObject<HTMLElement | null> | React.MutableRefObject<HTMLElement | null>;
  vitrineListaNome: string;
  buscaRealizada: boolean;
  paginacao: PaginacaoInfo;
  totalEncontrados: number;
  loadingProfissionais: boolean;
  profissionais: ProfissionalResumo[];
  canUnlock: boolean;
  slotsRestantes: number | null;
  canExportProfiles?: boolean;
  unlockingId: string | null;
  openProfile: (profileId: string, slug?: string) => void;
  handleUnlock: (profileId: string) => void;
  handleExportProfile: (profileId: string) => void;
  irParaPagina: (page: number) => void;
};

export default function CompanyDashboardVitrineSection({
  sectionRef,
  vitrineListaNome,
  buscaRealizada,
  paginacao,
  totalEncontrados,
  loadingProfissionais,
  profissionais,
  canUnlock,
  slotsRestantes,
  canExportProfiles,
  unlockingId,
  openProfile,
  handleUnlock,
  handleExportProfile,
  irParaPagina,
}: CompanyDashboardVitrineSectionProps) {
  return (
    <section ref={sectionRef} style={{ marginBottom: 16 }}>
      <h2 style={{ ...dashSectionTitle, margin: "0 0 8px", fontSize: 15 }}>
        {vitrineListaNome
          ? `Banco de talentos — ${vitrineListaNome}`
          : "Profissionais na vitrine"}
        {buscaRealizada ? ` (${paginacao.total || totalEncontrados})` : ""}
      </h2>

      {!buscaRealizada || profissionais.length === 0 ? (
        <div className="ri-dash-vitrine-empty">
          {loadingProfissionais ? (
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <AmpulhetaLoading compact label="Buscando..." size={16} color={DASH.gold} />
              Buscando profissionais…
            </span>
          ) : buscaRealizada ? (
            <>
              <strong>Nenhum profissional encontrado</strong>
              <span>Ajuste os filtros e clique em Buscar novamente.</span>
            </>
          ) : (
            <>
              <strong>Nenhuma busca ainda</strong>
              <span>Preencha ao menos um filtro acima e clique em Buscar para ver profissionais compatíveis.</span>
            </>
          )}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 10,
              alignContent: "start",
            }}
          >
            {profissionais.map((p) => (
              <CardPerfil
                key={p.id}
                p={p}
                onOpen={() => openProfile(p.id, p.slug)}
                canUnlock={p.bloqueado && canUnlock && (slotsRestantes === null || slotsRestantes > 0)}
                canExport={canExportProfiles && !p.bloqueado}
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
  );
}
