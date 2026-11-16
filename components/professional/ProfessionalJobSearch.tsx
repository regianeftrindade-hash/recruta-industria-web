"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CONTRACT_TYPES, WORK_MODES, type PublicJob } from "@/lib/jobs/job-posting";
import { paginarLista, paginasDaBarra } from "@/lib/jobs/paginate-list";
import { comparePublicationDateDesc, jobApplicationDeadline } from "@/lib/jobs/public-job-display";
import { VAGAS_COMPATIVEIS_ENABLED } from "@/lib/jobs/vagas-compativeis-flag";
import JobFavoriteButton from "@/components/jobs/JobFavoriteButton";
import { t } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import styles from "./professional-job-search.module.css";

type CompatibleJob = PublicJob & { reasons: string[] };

type SearchState = {
  q: string;
  cidade: string;
  estado: string;
  periodo: string;
  faixa: string;
  contrato: string;
  modalidade: string;
};

function porDataDePublicacao<T extends { publicationDate: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => comparePublicationDateDesc(a.publicationDate, b.publicationDate));
}

const EMPTY: SearchState = {
  q: "",
  cidade: "",
  estado: "",
  periodo: "",
  faixa: "",
  contrato: "",
  modalidade: "",
};

const ESTADOS: Array<{ uf: string; nome: string }> = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

const FAIXAS_SALARIO: Array<{ id: string; label: string; minimo: string; maximo: string; negociavel: boolean }> = [
  { id: "1000-2000", label: "1.000,00 a 2.000,00", minimo: "1000", maximo: "2000", negociavel: false },
  { id: "2000-3000", label: "2.000,00 a 3.000,00", minimo: "2000", maximo: "3000", negociavel: false },
  { id: "3000-4000", label: "3.000,00 a 4.000,00", minimo: "3000", maximo: "4000", negociavel: false },
  { id: "4000-5000", label: "4.000,00 a 5.000,00", minimo: "4000", maximo: "5000", negociavel: false },
  { id: "acima-5000", label: "Acima de 5.000,00", minimo: "5000,01", maximo: "", negociavel: false },
  { id: "combinar", label: "A combinar", minimo: "", maximo: "", negociavel: true },
];

const CONTRATO: Record<string, MessageKey> = {
  CLT: "surface.jobs.clt",
  PJ: "surface.jobs.pj",
  ESTAGIO: "surface.jobs.intern",
  TEMPORARIO: "surface.jobs.temporary",
  APRENDIZ: "surface.jobs.apprentice",
  FREELANCER: "surface.jobs.freelancer",
  OUTRO: "surface.jobs.other",
};

const MODALIDADE: Record<string, MessageKey> = {
  HOME_OFFICE: "surface.jobs.remote",
  PRESENCIAL: "surface.jobs.onSite",
  HIBRIDO: "surface.jobs.hybrid",
};

const FAIXA_ROTULO: Record<string, MessageKey> = {
  "1000-2000": "internal.pro.salary1000",
  "2000-3000": "internal.pro.salary2000",
  "3000-4000": "internal.pro.salary3000",
  "4000-5000": "internal.pro.salary4000",
  "acima-5000": "internal.pro.salaryAbove",
  combinar: "surface.jobs.salaryAgree",
};

function contractOptionLabel(value: string, label: string): string {
  return CONTRATO[value] ? t(CONTRATO[value]) : label;
}

function modeOptionLabel(value: string, label: string): string {
  return MODALIDADE[value] ? t(MODALIDADE[value]) : label;
}

function semAcento(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const BUSCAS_KEY = "ri-profissional-buscas-vagas";
const MAX_BUSCAS = 6;
const VAGAS_POR_PAGINA = 10;

function Paginador({
  rotulo,
  pagina,
  total,
  onIr,
}: {
  rotulo: string;
  pagina: number;
  total: number;
  onIr: (numero: number) => void;
}) {
  if (total <= 1) return null;
  return (
    <nav className={styles.pager} aria-label={rotulo}>
      <button type="button" disabled={pagina <= 1} onClick={() => onIr(1)}>{t("internal.pro.first")}</button>
      <button type="button" disabled={pagina <= 1} onClick={() => onIr(pagina - 1)}>{t("internal.pro.back")}</button>
      {paginasDaBarra(pagina, total).map((numero) => (
        <button
          key={numero}
          type="button"
          aria-current={numero === pagina ? "page" : undefined}
          className={numero === pagina ? styles.pagerOn : undefined}
          onClick={() => onIr(numero)}
        >
          {numero}
        </button>
      ))}
      <button type="button" disabled={pagina >= total} onClick={() => onIr(pagina + 1)}>{t("surface.jobs.next")}</button>
      <button type="button" disabled={pagina >= total} onClick={() => onIr(total)}>{t("internal.pro.last")}</button>
    </nav>
  );
}

type BuscaSalva = { id: string; form: SearchState; label: string };

function temFiltro(form: SearchState): boolean {
  return Object.values(form).some((value) => value.trim() !== "");
}

function vagaPublica(value: unknown): value is PublicJob {
  if (!value || typeof value !== "object") return false;
  const job = value as PublicJob;
  return typeof job.id === "string" && typeof job.title === "string" && typeof job.companyLabel === "string";
}

function CartaoVaga({
  job,
  favorito,
  onFavorito,
  reasons,
}: {
  job: PublicJob;
  favorito: boolean;
  onFavorito: (job: PublicJob, favorited: boolean) => void;
  reasons?: string[];
}) {
  return (
    <article className={styles.card}>
      <h3>{job.title}</h3>
      <p className={styles.company}>{job.companyLabel}</p>
      {reasons && reasons.length > 0 ? <p className={styles.reasons}>{reasons.join(" · ")}</p> : null}
      <ul>
        {job.publicationDate ? <li>{job.publicationDate}</li> : null}
        {job.salaryLabel ? <li>{job.salaryLabel}</li> : null}
        {job.contractLabel ? <li>{job.contractLabel}</li> : null}
        {job.workModeLabel ? <li>{job.workModeLabel}</li> : null}
        {job.workplace ? <li>{job.workplace}</li> : null}
        {jobApplicationDeadline(job) ? <li>{t("surface.jobs.deadline")} {jobApplicationDeadline(job)}</li> : null}
      </ul>
      <div className={styles.cardActions}>
        <a href={`/vagas/${job.id}`}>{t("internal.pro.seeJob")}</a>
        <JobFavoriteButton
          jobId={job.id}
          ativo={favorito}
          retorno="/professional/dashboard"
          onChange={(marcado) => onFavorito(job, marcado)}
        />
      </div>
    </article>
  );
}

function rotuloBusca(form: SearchState): string {
  const partes: string[] = [];
  if (form.q.trim()) partes.push(form.q.trim());
  if (form.estado) partes.push(form.estado);
  if (form.cidade) partes.push(form.cidade);
  const faixa = FAIXAS_SALARIO.find((item) => item.id === form.faixa);
  if (faixa) partes.push(FAIXA_ROTULO[faixa.id] ? t(FAIXA_ROTULO[faixa.id]) : faixa.label);
  if (form.periodo === "24h") partes.push(t("internal.pro.hours24"));
  else if (form.periodo) partes.push(`${form.periodo} ${t("internal.pro.days")}`);
  const contrato = CONTRACT_TYPES.find((item) => item.value === form.contrato);
  if (contrato) partes.push(contractOptionLabel(contrato.value, contrato.label));
  const modo = WORK_MODES.find((item) => item.value === form.modalidade);
  if (modo) partes.push(modeOptionLabel(modo.value, modo.label));
  return partes.join(" · ");
}

function buscaValida(value: unknown): value is BuscaSalva {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<BuscaSalva>;
  if (typeof item.id !== "string" || typeof item.label !== "string" || !item.form) return false;
  const form = item.form;
  return (Object.keys(EMPTY) as Array<keyof SearchState>).every((key) => typeof form[key] === "string");
}

function lerBuscas(): BuscaSalva[] {
  try {
    const raw = localStorage.getItem(BUSCAS_KEY);
    const data = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(data)) return [];
    return data.filter(buscaValida).slice(0, MAX_BUSCAS);
  } catch {
    return [];
  }
}

function guardarBusca(form: SearchState): BuscaSalva[] {
  if (!temFiltro(form)) return lerBuscas();
  try {
    const atual: BuscaSalva = { id: String(Date.now()), form, label: rotuloBusca(form) };
    const anteriores = lerBuscas().filter((item) => JSON.stringify(item.form) !== JSON.stringify(form));
    const proximas = [atual, ...anteriores].slice(0, MAX_BUSCAS);
    localStorage.setItem(BUSCAS_KEY, JSON.stringify(proximas));
    return proximas;
  } catch {
    return lerBuscas();
  }
}

function ListaFlutuante({
  label,
  value,
  placeholder,
  options,
  vazio,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Array<{ id: string; label: string }>;
  vazio: string;
  onChange: (id: string) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLLabelElement>(null);
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState(value);
  const selecionada = options.find((item) => item.id === value);

  useEffect(() => {
    setTexto(selecionada?.label || value);
  }, [selecionada?.label, value]);

  useEffect(() => {
    if (!aberto) return;
    function fechar(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, [aberto]);

  const filtradas = useMemo(() => {
    const consulta = semAcento(texto.trim());
    if (!consulta || consulta === semAcento(selecionada?.label || "")) return options;
    return options.filter((item) => semAcento(item.label).includes(consulta));
  }, [options, selecionada?.label, texto]);

  return (
    <label className={styles.field} ref={rootRef}>
      {label}
      <span className={styles.combo}>
        <input
          className={styles.control}
          value={texto}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={aberto}
          aria-controls={listId}
          autoComplete="off"
          onFocus={() => setAberto(true)}
          onChange={(event) => {
            setTexto(event.target.value);
            setAberto(true);
            if (!event.target.value.trim()) onChange("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setAberto(false);
            if (event.key === "Enter" && filtradas[0]) {
              event.preventDefault();
              onChange(filtradas[0].id);
              setAberto(false);
            }
          }}
        />
        <button
          type="button"
          className={styles.arrow}
          data-combo-arrow=""
          data-open={aberto ? "true" : "false"}
          aria-label={aberto ? t("internal.pro.closeList") : t("internal.pro.openList")}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setAberto((atual) => !atual)}
        >
          <svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
            <path d="M1 1.5 L6 6.5 L11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </span>
      {aberto ? (
        <ul id={listId} className={styles.menu} role="listbox">
          {filtradas.length === 0 ? (
            <li className={styles.menuEmpty}>{vazio}</li>
          ) : (
            filtradas.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={item.id === value}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(item.id);
                    setAberto(false);
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </label>
  );
}

export default function ProfessionalJobSearch() {
  const [form, setForm] = useState<SearchState>(EMPTY);
  const [cidades, setCidades] = useState<string[]>([]);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [compatible, setCompatible] = useState<CompatibleJob[]>([]);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [matchError, setMatchError] = useState("");
  const [consulta, setConsulta] = useState<SearchState>(EMPTY);
  const [buscas, setBuscas] = useState<BuscaSalva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagina, setPagina] = useState(1);
  const [paginaCompativeis, setPaginaCompativeis] = useState(1);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [vagasFavoritas, setVagasFavoritas] = useState<PublicJob[]>([]);
  const [favoritosProntos, setFavoritosProntos] = useState(false);
  const [erroFavoritos, setErroFavoritos] = useState("");
  const [paginaFavoritos, setPaginaFavoritos] = useState(1);
  const listaRef = useRef<HTMLHeadingElement>(null);
  const compativeisRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!form.estado) {
      setCidades([]);
      return;
    }
    let ativo = true;
    setCarregandoCidades(true);
    void fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.estado}/municipios`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Array<{ nome: string }>) => {
        if (!ativo) return;
        setCidades(data.map((item) => item.nome).sort((a, b) => a.localeCompare(b, "pt-BR")));
      })
      .catch(() => {
        if (ativo) setCidades([]);
      })
      .finally(() => {
        if (ativo) setCarregandoCidades(false);
      });
    return () => {
      ativo = false;
    };
  }, [form.estado]);

  useEffect(() => {
    setBuscas(lerBuscas());
  }, []);

  useEffect(() => {
    let ativo = true;
    void fetch("/api/professional/vagas/favoritos", { credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        return { ok: response.ok, data };
      })
      .then(({ ok, data }) => {
        if (!ativo) return;
        if (!ok) {
          setErroFavoritos(typeof data?.error === "string" ? data.error : t("internal.pro.favoritesError"));
          return;
        }
        const jobs = Array.isArray(data?.jobs) ? data.jobs.filter(vagaPublica) : [];
        setVagasFavoritas(jobs);
        setFavoritos(Array.isArray(data?.ids) ? data.ids.filter((id: unknown) => typeof id === "string") : jobs.map((job: PublicJob) => job.id));
        setErroFavoritos("");
      })
      .catch(() => {
        if (ativo) setErroFavoritos(t("internal.pro.favoritesError"));
      })
      .finally(() => {
        if (ativo) setFavoritosProntos(true);
      });
    return () => {
      ativo = false;
    };
  }, []);

  async function load(next: SearchState, salvar = false) {
    setLoading(true);
    setError("");
    setMatchError("");
    setPagina(1);
    setPaginaCompativeis(1);
    setConsulta(next);
    const params = new URLSearchParams();
    const faixa = FAIXAS_SALARIO.find((item) => item.id === next.faixa);
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.cidade.trim()) params.set("cidade", next.cidade.trim());
    if (next.estado.trim()) params.set("estado", next.estado.trim());
    if (next.periodo) params.set("periodo", next.periodo);
    if (next.contrato) params.set("contrato", next.contrato);
    if (next.modalidade) params.set("modalidade", next.modalidade);
    if (faixa?.negociavel) params.set("salario", "negociavel");
    if (faixa && !faixa.negociavel && faixa.minimo) params.set("minimo", faixa.minimo);
    if (faixa && !faixa.negociavel && faixa.maximo) params.set("maximo", faixa.maximo);

    try {
      const response = await fetch(`/api/vagas?${params.toString()}`, { credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || t("internal.pro.searchError"));
        setJobs([]);
        setCompatible([]);
        setMatchError("");
        return;
      }
      const found = porDataDePublicacao(Array.isArray(data.jobs) ? data.jobs as PublicJob[] : []);
      if (!VAGAS_COMPATIVEIS_ENABLED) {
        setIsPremium(null);
        setCompatible([]);
        setMatchError("");
        setJobs(found);
        if (salvar) setBuscas(guardarBusca(next));
        return;
      }
      const matchResponse = await fetch(`/api/professional/vagas-compativeis?${params.toString()}`, { credentials: "include" });
      const matchData = await matchResponse.json().catch(() => ({}));
      const premiumConfirmado = matchResponse.ok && matchData.premium === true;
      if (!premiumConfirmado) {
        const bloqueado = matchResponse.status === 403 || matchData.premiumRequired === true;
        setIsPremium(bloqueado ? false : null);
        setCompatible([]);
        setJobs(found);
        if (!bloqueado) {
          setMatchError(t("internal.pro.matchError"));
        }
        if (salvar) setBuscas(guardarBusca(next));
        return;
      }
      setIsPremium(true);
      const matches = porDataDePublicacao(Array.isArray(matchData.jobs) ? matchData.jobs as CompatibleJob[] : []);
      const matchedIds = new Set(matches.map((job) => job.id));
      setCompatible(matches);
      setJobs(found.filter((job) => !matchedIds.has(job.id)));
      if (salvar) setBuscas(guardarBusca(next));
    } catch {
      setError(t("internal.pro.searchError"));
      setJobs([]);
      setCompatible([]);
      setMatchError("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(EMPTY);
  }, []);

  function update<K extends keyof SearchState>(key: K, value: SearchState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const listaGeral = paginarLista(jobs, pagina, VAGAS_POR_PAGINA);
  const listaCompativel = paginarLista(compatible, paginaCompativeis, VAGAS_POR_PAGINA);
  const listaFavoritos = paginarLista(vagasFavoritas, paginaFavoritos, VAGAS_POR_PAGINA);

  function aoFavorito(job: PublicJob, favorited: boolean) {
    setErroFavoritos("");
    setFavoritos((atual) => (
      favorited
        ? (atual.includes(job.id) ? atual : [job.id, ...atual])
        : atual.filter((id) => id !== job.id)
    ));
    setVagasFavoritas((atual) => (
      favorited
        ? (atual.some((item) => item.id === job.id) ? atual : [job, ...atual])
        : atual.filter((item) => item.id !== job.id)
    ));
    if (favorited) setPaginaFavoritos(1);
  }

  function irParaPagina(numero: number, qual: "geral" | "compativeis") {
    if (qual === "compativeis") {
      setPaginaCompativeis(numero);
      compativeisRef.current?.scrollIntoView({ block: "start" });
      return;
    }
    setPagina(numero);
    listaRef.current?.scrollIntoView({ block: "start" });
  }

  const opcoesEstado = ESTADOS.map((estado) => ({
    id: estado.uf,
    label: `${estado.uf} — ${estado.nome}`,
  }));
  const opcoesCidade = cidades.map((cidade) => ({ id: cidade, label: cidade }));
  const opcoesFaixa = FAIXAS_SALARIO.map((faixa) => ({
    id: faixa.id,
    label: FAIXA_ROTULO[faixa.id] ? t(FAIXA_ROTULO[faixa.id]) : faixa.label,
  }));

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>{t("surface.dash.pro.jobs")}</h2>
      <p className={styles.lead}>{t("internal.pro.searchLead")}</p>
      <form
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault();
          void load(form, true);
        }}
      >
        <label className={styles.fieldWide}>
          {t("surface.jobs.keyword")}
          <input className={styles.control} value={form.q} onChange={(event) => update("q", event.target.value)} maxLength={80} placeholder={t("surface.jobs.keyword")} />
        </label>
        <ListaFlutuante
          label={t("surface.jobs.state")}
          value={form.estado}
          placeholder={t("internal.pro.uf")}
          options={opcoesEstado}
          vazio={t("internal.pro.noState")}
          onChange={(uf) => setForm((current) => ({ ...current, estado: uf, cidade: "" }))}
        />
        <ListaFlutuante
          label={t("surface.jobs.city")}
          value={form.cidade}
          placeholder={form.estado ? t("surface.jobs.city") : t("internal.pro.pickState")}
          options={opcoesCidade}
          vazio={form.estado ? (carregandoCidades ? t("internal.pro.loadingCities") : t("internal.pro.noCity")) : t("internal.pro.pickStateCities")}
          onChange={(cidade) => update("cidade", cidade)}
        />
        <label>
          {t("surface.jobs.published")}
          <select className={styles.control} value={form.periodo} onChange={(event) => update("periodo", event.target.value)}>
            <option value="">{t("surface.jobs.anyDate")}</option>
            <option value="24h">{t("surface.jobs.last24")}</option>
            <option value="7">{t("surface.jobs.last7")}</option>
            <option value="15">{t("surface.jobs.last15")}</option>
            <option value="30">{t("surface.jobs.last30")}</option>
          </select>
        </label>
        <ListaFlutuante
          label={t("surface.jobs.salary")}
          value={form.faixa}
          placeholder={t("internal.pro.range")}
          options={opcoesFaixa}
          vazio={t("internal.pro.noRange")}
          onChange={(faixa) => update("faixa", faixa)}
        />
        <label>
          {t("surface.jobs.contract")}
          <select className={styles.control} value={form.contrato} onChange={(event) => update("contrato", event.target.value)}>
            <option value="">{t("internal.pro.allMasc")}</option>
            {CONTRACT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{contractOptionLabel(option.value, option.label)}</option>
            ))}
          </select>
        </label>
        <label>
          {t("surface.jobs.mode")}
          <select className={styles.control} value={form.modalidade} onChange={(event) => update("modalidade", event.target.value)}>
            <option value="">{t("surface.jobs.all")}</option>
            {WORK_MODES.map((option) => (
              <option key={option.value} value={option.value}>{modeOptionLabel(option.value, option.label)}</option>
            ))}
          </select>
        </label>
        <div className={styles.actions}>
          <button type="submit">{t("surface.jobs.search")}</button>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => {
              setForm(EMPTY);
              void load(EMPTY);
            }}
          >
            {t("surface.jobs.clear")}
          </button>
        </div>
      </form>

      {buscas.length > 0 ? (
        <div className={styles.history}>
          <p>{t("internal.pro.recentSearches")}</p>
          <div>
            {buscas.map((busca) => (
              <button
                key={busca.id}
                type="button"
                onClick={() => {
                  setForm(busca.form);
                  void load(busca.form, true);
                }}
              >
                {rotuloBusca(busca.form)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.lead}>{t("internal.pro.searching")}</p> : null}
      {VAGAS_COMPATIVEIS_ENABLED && !loading && !error && matchError && isPremium !== true ? <p className={styles.error}>{matchError}</p> : null}
      {VAGAS_COMPATIVEIS_ENABLED && !loading && !error && isPremium === false ? (
        <section className={styles.matches} aria-label={t("internal.pro.matches")}>
          <h3 className={styles.title}>{t("internal.pro.matches")}</h3>
          <div className={styles.premium}>
            <p>{t("internal.pro.premiumList")}</p>
            <a href="/professional/pagamento">{t("internal.pro.subscribePremium")}</a>
          </div>
        </section>
      ) : null}
      {VAGAS_COMPATIVEIS_ENABLED && !loading && !error && isPremium === true ? (
        <section className={styles.matches} aria-label={t("internal.pro.matches")}>
          <h3 ref={compativeisRef} className={styles.title}>{t("internal.pro.matches")}</h3>
          {matchError ? (
            <p className={styles.error}>{matchError}</p>
          ) : compatible.length === 0 ? (
            <p className={styles.empty}>{t("internal.pro.noMatches")}</p>
          ) : (
            <div className={styles.list}>
              {listaCompativel.itens.map((job) => (
                <CartaoVaga
                  key={job.id}
                  job={job}
                  reasons={job.reasons}
                  favorito={favoritos.includes(job.id)}
                  onFavorito={aoFavorito}
                />
              ))}
            </div>
          )}
          <Paginador
            rotulo={t("internal.pro.matchPages")}
            pagina={listaCompativel.pagina}
            total={listaCompativel.totalPaginas}
            onIr={(numero) => irParaPagina(numero, "compativeis")}
          />
        </section>
      ) : null}

      {!loading && !error ? (
        <section className={styles.matches} aria-label={t("internal.pro.favorites")}>
          <h3 className={styles.title}>{t("internal.pro.favorites")}</h3>
          {!favoritosProntos ? <p className={styles.lead}>{t("internal.pro.loadingFavorites")}</p> : null}
          {favoritosProntos && erroFavoritos ? <p className={styles.error}>{erroFavoritos}</p> : null}
          {favoritosProntos && !erroFavoritos && vagasFavoritas.length === 0 ? (
            <p className={styles.empty}>{t("internal.pro.noFavorites")}</p>
          ) : null}
          {listaFavoritos.itens.length > 0 ? (
            <div className={styles.list}>
              {listaFavoritos.itens.map((job) => (
                <CartaoVaga
                  key={job.id}
                  job={job}
                  favorito={favoritos.includes(job.id)}
                  onFavorito={aoFavorito}
                />
              ))}
            </div>
          ) : null}
          {favoritosProntos ? (
            <Paginador
              rotulo={t("internal.pro.favoritePages")}
              pagina={listaFavoritos.pagina}
              total={listaFavoritos.totalPaginas}
              onIr={setPaginaFavoritos}
            />
          ) : null}
        </section>
      ) : null}

      {!loading && !error ? <h3 ref={listaRef} className={styles.title}>{t("internal.pro.allJobs")}</h3> : null}
      {!loading && !error && jobs.length === 0 ? (
        <p className={styles.empty}>
          {temFiltro(consulta)
            ? (VAGAS_COMPATIVEIS_ENABLED ? t("internal.pro.noneOtherFiltered") : t("surface.jobs.noneFiltered"))
            : (VAGAS_COMPATIVEIS_ENABLED ? t("internal.pro.noneOther") : t("internal.pro.nonePublished"))}
        </p>
      ) : null}

      {!loading && !error && listaGeral.itens.length > 0 ? (
        <div className={styles.list}>
          {listaGeral.itens.map((job) => (
            <CartaoVaga
              key={job.id}
              job={job}
              favorito={favoritos.includes(job.id)}
              onFavorito={aoFavorito}
            />
          ))}
        </div>
      ) : null}

      {!loading && !error ? (
        <Paginador
          rotulo={t("internal.pro.allPages")}
          pagina={listaGeral.pagina}
          total={listaGeral.totalPaginas}
          onIr={(numero) => irParaPagina(numero, "geral")}
        />
      ) : null}
    </section>
  );
}
