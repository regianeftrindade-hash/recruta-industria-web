/* 🔒 BLOQUEADO (06/07/2026) — não editar sem pedido explícito. Ver .cursor/rules/dashboard-page-lock.mdc */
"use client";

import React from "react";
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
  onFiltrosChange,
  onToggleBuscaAvancada,
  onBuscar,
  onLimpar,
}: CompanyDashboardVitrineSearchFiltersProps) {
  return (
    <section style={{ marginBottom: 12 }}>
      <h3 style={{ ...dashSectionTitle, margin: "0 0 6px", fontSize: 13 }}>Busca rápida</h3>
      <div data-card="1" className="dash-card" style={{ padding: 12, ...dashCard }}>
        <div style={filtersGridStyle}>
          <div style={filterFieldStyle}>
            <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Cargo</label>
            <input
              placeholder="Ex.: Operador de CNC"
              value={filtros.cargo}
              onChange={(e) => onFiltrosChange({ ...filtros, cargo: e.target.value })}
              style={filterControlStyle}
            />
          </div>
          <div style={filterFieldStyle}>
            <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => onFiltrosChange({ ...filtros, estado: e.target.value, cidade: "" })}
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
              onChange={(e) => onFiltrosChange({ ...filtros, cidade: e.target.value })}
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
              onChange={(e) => onFiltrosChange({ ...filtros, experiencia: e.target.value })}
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
              onChange={(e) => onFiltrosChange({ ...filtros, turno: e.target.value })}
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
            {buscaAvancadaAberta ? "▲ Ocultar avançada" : "Busca avançada"}
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <button
              onClick={onBuscar}
              disabled={loadingProfissionais}
              className="ri-dash-btn-primary"
              style={{
                ...btnGold,
                padding: "9px 20px",
                fontSize: 13,
                fontWeight: 800,
                opacity: loadingProfissionais ? 0.7 : 1,
              }}
            >
              {loadingProfissionais ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <AmpulhetaLoading compact label="Buscando..." size={16} color="#1a1a1a" />
                  Buscando...
                </span>
              ) : "Buscar"}
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
            >
              Limpar
            </button>
          </div>
        </div>

        {buscaAvancadaAberta && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${DASH.border}` }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: DASH.muted }}>
              Filtros avançados
            </p>
            {advancedFilterDisabled && (
              <p style={{ margin: "0 0 10px", fontSize: 10, color: DASH.muted }}>
                Filtros avançados disponíveis a partir do plano <span style={dashPlanAccent}>Basic</span>.
              </p>
            )}
            <div style={filtersGridStyle}>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Área de interesse</label>
                <select value={filtros.area} onChange={(e) => onFiltrosChange({ ...filtros, area: e.target.value })} style={filterControlStyle}>
                  <option value="">Selecione</option>
                  {AREAS_INTERESSE.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Escolaridade (nível) {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.escolaridade} onChange={(e) => onFiltrosChange({ ...filtros, escolaridade: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {ESCOLARIDADES_OPCOES.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Situação profissional {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.situacaoProfissional} onChange={(e) => onFiltrosChange({ ...filtros, situacaoProfissional: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {SITUACAO_PROFISSIONAL_OPCOES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Nível operacional {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.nivelOperacional} onChange={(e) => onFiltrosChange({ ...filtros, nivelOperacional: e.target.value, areaNivel: e.target.value ? filtros.areaNivel : "" })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {NIVEIS_OPERACIONAIS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Área operacional {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled || !filtros.nivelOperacional} value={filtros.areaNivel} onChange={(e) => onFiltrosChange({ ...filtros, areaNivel: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled || !filtros.nivelOperacional ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {AREAS_COMPLEMENTO_NIVEL.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Disponibilidade para início {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.disponibilidadeInicio} onChange={(e) => onFiltrosChange({ ...filtros, disponibilidadeInicio: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
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
                  onChange={(e) => onFiltrosChange({
                    ...filtros,
                    pretensaoSalarial: formatPretensaoSalarialInput(e.target.value),
                  })}
                  style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}
                />
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Trabalhou na indústria? {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.trabalhouIndustria} onChange={(e) => onFiltrosChange({ ...filtros, trabalhouIndustria: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {TRABALHO_INDUSTRIA_OPCOES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Segmento (experiência) {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.segmentoIndustria} onChange={(e) => onFiltrosChange({ ...filtros, segmentoIndustria: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {SEGMENTOS_INDUSTRIA.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Máquinas/equipamentos {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.maquinaEquipamento} onChange={(e) => onFiltrosChange({ ...filtros, maquinaEquipamento: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {MAQUINAS_EQUIPAMENTOS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Qualidade e processos {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.qualidadeProcesso} onChange={(e) => onFiltrosChange({ ...filtros, qualidadeProcesso: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {QUALIDADE_PROCESSOS.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Informática/ERP {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.informatica} onChange={(e) => onFiltrosChange({ ...filtros, informatica: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {INFORMATICA_OPCOES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Possui CNH? {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.possuiCNH} onChange={(e) => onFiltrosChange({ ...filtros, possuiCNH: e.target.value, categoriaCNH: e.target.value === "Sim" ? filtros.categoriaCNH : "" })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {POSSUI_CNH_OPCOES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Categoria CNH {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled || filtros.possuiCNH !== "Sim"} value={filtros.categoriaCNH} onChange={(e) => onFiltrosChange({ ...filtros, categoriaCNH: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled || filtros.possuiCNH !== "Sim" ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {CNH_CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Curso/Certificação {advancedFilterDisabled && "🔒"}</label>
                <input disabled={advancedFilterDisabled} placeholder="Ex: NR-12" value={filtros.cursoCertificacao} onChange={(e) => onFiltrosChange({ ...filtros, cursoCertificacao: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }} />
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Área do curso {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.areaCurso} onChange={(e) => onFiltrosChange({ ...filtros, areaCurso: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {AREAS_CURSO.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Idioma {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.idioma} onChange={(e) => onFiltrosChange({ ...filtros, idioma: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {IDIOMAS_OPCOES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Disponibilidade para mudança {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.disponibilidadeMudanca} onChange={(e) => onFiltrosChange({ ...filtros, disponibilidadeMudanca: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {DISPONIBILIDADE_MUDANCA_OPCOES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={filterFieldStyle}>
                <label style={{ display: "block", fontSize: 11, ...dashLabel, marginBottom: 4 }}>Disponibilidade para viagens {advancedFilterDisabled && "🔒"}</label>
                <select disabled={advancedFilterDisabled} value={filtros.aceitaViagens} onChange={(e) => onFiltrosChange({ ...filtros, aceitaViagens: e.target.value })} style={{ ...filterControlStyle, opacity: advancedFilterDisabled ? 0.5 : 1 }}>
                  <option value="">Selecione</option>
                  {ACEITA_VIAGENS_OPCOES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
