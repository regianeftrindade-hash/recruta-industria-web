/* 🔒 BLOQUEADO (06/07/2026) — não editar sem pedido explícito. Ver .cursor/rules/dashboard-page-lock.mdc */
"use client";
import { exactUi } from "@/lib/i18n/exact-ui";
import { t } from "@/lib/i18n/translate";

import React from "react";
import { rotuloOpcao } from "@/lib/i18n/option-label";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
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
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import {
  DASH,
  dashCard,
  dashInput,
  dashLabel,
  dashPlanAccent,
  dashSectionTitle,
} from "@/lib/dashboard-theme";

export interface Filtros {
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

const filterFieldStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
};

const filterControlStyle: React.CSSProperties = {
  ...dashInput,
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 8px",
  fontSize: 12,
};

const filterLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  ...dashLabel,
  marginBottom: 2,
  lineHeight: 1.2,
};

const filtersGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
  gap: 6,
  alignItems: "end",
};

const filterActionsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "center",
  justifyContent: "flex-end",
  marginTop: 8,
};

export const EMPTY_FILTROS: Filtros = {
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

export function filtrosTemValor(f: Filtros): boolean {
  return Object.values(f).some((v) => String(v).trim() !== "");
}

export type CompanyDashboardVitrineSearchFiltersProps = {
  filtros: Filtros;
  cidadesOpcoes: string[];
  buscaAvancadaAberta: boolean;
  loadingProfissionais: boolean;
  advancedFilterDisabled: boolean;
  searchDisabled?: boolean;
  onFiltrosChange: (filtros: Filtros) => void;
  onToggleBuscaAvancada: () => void;
  onBuscar: () => void;
  onLimpar: () => void;
};

export default function CompanyDashboardVitrineSearchFilters({
  filtros,
  cidadesOpcoes,
  buscaAvancadaAberta,
  loadingProfissionais,
  advancedFilterDisabled,
  searchDisabled = false,
  onFiltrosChange,
  onToggleBuscaAvancada,
  onBuscar,
  onLimpar,
}: CompanyDashboardVitrineSearchFiltersProps) {
  return (
    <section className="ri-cream-field" style={{ marginBottom: 10 }}>
      <h3 style={{ ...dashSectionTitle, margin: "0 0 4px", fontSize: 12 }}>{exactUi("Busca rápida")}</h3>
      <div data-card="1" className="dash-card" style={{ padding: 10, ...dashCard }}>
        <div style={filtersGridStyle}>
          <div style={filterFieldStyle}>
            <label style={filterLabelStyle}>{exactUi("Cargo")}</label>
            <input
              placeholder={exactUi("Ex.: Operador de CNC")}
              value={filtros.cargo}
              onChange={(e) => onFiltrosChange({ ...filtros, cargo: e.target.value })}
              style={filterControlStyle}
            />
          </div>
          <div style={filterFieldStyle}>
            <label style={filterLabelStyle}>{exactUi("Estado")}</label>
            <select
              value={filtros.estado}
              onChange={(e) => onFiltrosChange({ ...filtros, estado: e.target.value, cidade: "" })}
              style={filterControlStyle}
            >
              <option value="">{exactUi("Selecione")}</option>
              {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div style={filterFieldStyle}>
            <label style={filterLabelStyle}>{exactUi("Cidade")}</label>
            <select
              value={filtros.cidade}
              disabled={!filtros.estado}
              onChange={(e) => onFiltrosChange({ ...filtros, cidade: e.target.value })}
              style={{ ...filterControlStyle, opacity: filtros.estado ? 1 : 0.5 }}
            >
              <option value="">{filtros.estado ? exactUi("Selecione") : exactUi("Escolha o estado")}</option>
              {cidadesOpcoes.map((cidade) => <option key={cidade} value={cidade}>{cidade}</option>)}
            </select>
          </div>
          <div style={filterFieldStyle}>
            <label style={filterLabelStyle}>{exactUi("Experiência")}</label>
            <select
              value={filtros.experiencia}
              onChange={(e) => onFiltrosChange({ ...filtros, experiencia: e.target.value })}
              style={filterControlStyle}
            >
              <option value="">{exactUi("Selecione")}</option>
              {TEMPOS_EXPERIENCIA_OPCOES.map((t) => (
                <option key={t} value={t}>{rotuloOpcao(t)}</option>
              ))}
            </select>
          </div>
          <div style={filterFieldStyle}>
            <label style={filterLabelStyle}>{exactUi("Turno")}</label>
            <select
              value={filtros.turno}
              onChange={(e) => onFiltrosChange({ ...filtros, turno: e.target.value })}
              style={filterControlStyle}
            >
              <option value="">{exactUi("Selecione")}</option>
              {TURNOS_DISPONIVEIS.map((t) => (
                <option key={t} value={t}>
                  {t === "1º Turno" ? exactUi("Primeiro") : t === "2º Turno" ? exactUi("Segundo") : t === "3º Turno" ? exactUi("Terceiro") : t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ ...filterActionsStyle, justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={onToggleBuscaAvancada}
            className="ri-dash-btn-secondary"
            style={{
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 8,
              cursor: "pointer",
              borderColor: buscaAvancadaAberta ? "rgba(200,155,60,0.45)" : undefined,
              color: buscaAvancadaAberta ? DASH.gold : undefined,
              background: buscaAvancadaAberta ? "rgba(200,155,60,0.1)" : undefined,
            }}
          >
            {buscaAvancadaAberta ? exactUi("▲ Ocultar avançada") : exactUi("Busca avançada")}
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <button
              onClick={onBuscar}
              disabled={loadingProfissionais || searchDisabled}
              title={searchDisabled ? exactUi("A busca de profissionais fica disponível depois da verificação da empresa.") : undefined}
              className="ri-dash-btn-primary"
              style={{
                ...btnGold,
                padding: "9px 20px",
                fontSize: 13,
                fontWeight: 800,
                opacity: loadingProfissionais || searchDisabled ? 0.7 : 1,
              }}
            >
              {loadingProfissionais ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <AmpulhetaLoading compact label={exactUi("Buscando...")} size={16} color="#1a1a1a" />{exactUi("Buscando...")}</span>
              ) : exactUi("Buscar")}
            </button>
            <button
              type="button"
              onClick={onLimpar}
              className="ri-dash-btn-secondary"
              style={{
                padding: "8px 12px",
                fontSize: 11,
                borderRadius: 8,
                cursor: "pointer",
              }}
            >{exactUi("Limpar")}</button>
          </div>
        </div>

        {buscaAvancadaAberta && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${DASH.border}` }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: DASH.muted }}>{exactUi("Filtros avançados")}</p>
            {advancedFilterDisabled && (
              <p style={{ margin: "0 0 8px", fontSize: 10, color: DASH.muted }}>
                {t("surface.dash.company.advancedLocked")} <span style={dashPlanAccent}>Basic</span>.
              </p>
            )}
            <div style={filtersGridStyle}>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Área de interesse")}</label>
                <select value={filtros.area} onChange={(e) => onFiltrosChange({ ...filtros, area: e.target.value })} style={filterControlStyle}>
                  <option value="">{exactUi("Selecione")}</option>
                  {AREAS_INTERESSE.map((a) => <option key={a} value={a}>{rotuloOpcao(a)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Escolaridade (nível)")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.escolaridade} onChange={(e) => onFiltrosChange({ ...filtros, escolaridade: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {ESCOLARIDADES_OPCOES.map((e) => <option key={e} value={e}>{rotuloOpcao(e)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Situação profissional")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.situacaoProfissional} onChange={(e) => onFiltrosChange({ ...filtros, situacaoProfissional: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {SITUACAO_PROFISSIONAL_OPCOES.map((s) => <option key={s} value={s}>{rotuloOpcao(s)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Nível operacional")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.nivelOperacional} onChange={(e) => onFiltrosChange({ ...filtros, nivelOperacional: e.target.value, areaNivel: e.target.value ? filtros.areaNivel : "" })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {NIVEIS_OPERACIONAIS.map((n) => <option key={n} value={n}>{rotuloOpcao(n)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Área operacional")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled || !filtros.nivelOperacional} value={filtros.areaNivel} onChange={(e) => onFiltrosChange({ ...filtros, areaNivel: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled || !filtros.nivelOperacional ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {AREAS_COMPLEMENTO_NIVEL.map((a) => <option key={a} value={a}>{rotuloOpcao(a)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Disponibilidade para início")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.disponibilidadeInicio} onChange={(e) => onFiltrosChange({ ...filtros, disponibilidadeInicio: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {DISPONIBILIDADE_INICIO_OPCOES.map((d) => <option key={d} value={d}>{rotuloOpcao(d)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Pretensão salarial")} {advancedFilterDisabled && "🔒"}</label>
                <input
                  disabled={advancedFilterDisabled}
                  placeholder={exactUi("R$ 0,00")}
                  value={filtros.pretensaoSalarial}
                  onChange={(e) => onFiltrosChange({
                    ...filtros,
                    pretensaoSalarial: formatPretensaoSalarialInput(e.target.value),
                  })}
                  style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}
                />
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Trabalhou na indústria?")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.trabalhouIndustria} onChange={(e) => onFiltrosChange({ ...filtros, trabalhouIndustria: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {TRABALHO_INDUSTRIA_OPCOES.map((t) => <option key={t} value={t}>{rotuloOpcao(t)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Segmento (experiência)")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.segmentoIndustria} onChange={(e) => onFiltrosChange({ ...filtros, segmentoIndustria: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {SEGMENTOS_INDUSTRIA.map((s) => <option key={s} value={s}>{rotuloOpcao(s)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Máquinas/equipamentos")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.maquinaEquipamento} onChange={(e) => onFiltrosChange({ ...filtros, maquinaEquipamento: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {MAQUINAS_EQUIPAMENTOS.map((m) => <option key={m} value={m}>{rotuloOpcao(m)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Qualidade e processos")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.qualidadeProcesso} onChange={(e) => onFiltrosChange({ ...filtros, qualidadeProcesso: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {QUALIDADE_PROCESSOS.map((q) => <option key={q} value={q}>{rotuloOpcao(q)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Informática/ERP")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.informatica} onChange={(e) => onFiltrosChange({ ...filtros, informatica: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {INFORMATICA_OPCOES.map((i) => <option key={i} value={i}>{rotuloOpcao(i)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Possui CNH?")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.possuiCNH} onChange={(e) => onFiltrosChange({ ...filtros, possuiCNH: e.target.value, categoriaCNH: e.target.value === "Sim" ? filtros.categoriaCNH : "" })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {POSSUI_CNH_OPCOES.map((v) => <option key={v} value={v}>{rotuloOpcao(v)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Categoria CNH")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled || filtros.possuiCNH !== "Sim"} value={filtros.categoriaCNH} onChange={(e) => onFiltrosChange({ ...filtros, categoriaCNH: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled || filtros.possuiCNH !== "Sim" ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {CNH_CATEGORIAS.map((c) => <option key={c} value={c}>{rotuloOpcao(c)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Curso/Certificação")} {advancedFilterDisabled && "🔒"}</label>
                <input disabled={advancedFilterDisabled} placeholder={exactUi("Ex: NR-12")} value={filtros.cursoCertificacao} onChange={(e) => onFiltrosChange({ ...filtros, cursoCertificacao: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }} />
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Área do curso")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.areaCurso} onChange={(e) => onFiltrosChange({ ...filtros, areaCurso: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {AREAS_CURSO.map((a) => <option key={a} value={a}>{rotuloOpcao(a)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Idioma")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.idioma} onChange={(e) => onFiltrosChange({ ...filtros, idioma: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {IDIOMAS_OPCOES.map((i) => <option key={i} value={i}>{rotuloOpcao(i)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Disponibilidade para mudança")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.disponibilidadeMudanca} onChange={(e) => onFiltrosChange({ ...filtros, disponibilidadeMudanca: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {DISPONIBILIDADE_MUDANCA_OPCOES.map((v) => <option key={v} value={v}>{rotuloOpcao(v)}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={filterLabelStyle}>{exactUi("Disponibilidade para viagens")} {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.aceitaViagens} onChange={(e) => onFiltrosChange({ ...filtros, aceitaViagens: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">{exactUi("Selecione")}</option>
                  {ACEITA_VIAGENS_OPCOES.map((v) => <option key={v} value={v}>{rotuloOpcao(v)}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
