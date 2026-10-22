"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import JobShareActions from "@/components/jobs/JobShareActions";
import ProfessionalApplyButton from "@/components/jobs/ProfessionalApplyButton";
import { CONTRACT_TYPES, WORK_MODES, type PublicJob } from "@/lib/jobs/job-posting";
import { applyTarget } from "@/lib/jobs/public-job-link";
import styles from "./professional-job-search.module.css";

type SearchState = {
  q: string;
  cidade: string;
  estado: string;
  periodo: string;
  faixa: string;
  contrato: string;
  modalidade: string;
};

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

function contractOptionLabel(value: string, label: string): string {
  if (value === "APRENDIZ") return "Jovem Aprendiz";
  return label;
}

function modeOptionLabel(value: string, label: string): string {
  if (value === "HOME_OFFICE") return "Home office / remoto";
  return label;
}

function semAcento(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function excerpt(value: string): string {
  const plain = value.replace(/\s+/g, " ").trim();
  if (plain.length <= 140) return plain;
  return `${plain.slice(0, 137).trimEnd()}...`;
}

const BUSCAS_KEY = "ri-profissional-buscas-vagas";
const MAX_BUSCAS = 6;

type BuscaSalva = { id: string; form: SearchState; label: string };

function temFiltro(form: SearchState): boolean {
  return Object.values(form).some((value) => value.trim() !== "");
}

function rotuloBusca(form: SearchState): string {
  const partes: string[] = [];
  if (form.q.trim()) partes.push(form.q.trim());
  if (form.estado) partes.push(form.estado);
  if (form.cidade) partes.push(form.cidade);
  const faixa = FAIXAS_SALARIO.find((item) => item.id === form.faixa);
  if (faixa) partes.push(faixa.label);
  if (form.periodo === "24h") partes.push("24 horas");
  else if (form.periodo) partes.push(`${form.periodo} dias`);
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
          aria-label={aberto ? "Fechar lista" : "Abrir lista"}
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

function JobCardActions({ job }: { job: PublicJob }) {
  const target = applyTarget(job);
  let host = "";
  if (target.kind === "external") {
    try {
      host = new URL(target.href).hostname.replace(/^www\./, "");
    } catch {
      host = "";
    }
  }

  return (
    <div className={styles.cardActions}>
      {target.kind === "external" ? (
        <a href={target.href} title={target.href}>Candidatar-se</a>
      ) : (
        <ProfessionalApplyButton jobId={job.id} mode={target.kind === "email" ? "EMAIL" : "INTERNAL"} />
      )}
      <a href={`/vagas/${job.id}`}>Ver vaga</a>
      <JobShareActions jobId={job.id} title={job.title} className={styles.share} />
      <p className={styles.applyNote}>
        {target.kind === "external"
          ? `Abre o site da empresa${host ? `: ${host}` : ""}.`
          : target.kind === "email"
            ? "Envia a candidatura para o e-mail cadastrado nesta vaga. O endereço não aparece aqui."
            : "A candidatura fica registrada aqui no Recruta Indústria."}
      </p>
    </div>
  );
}

export default function ProfessionalJobSearch() {
  const [form, setForm] = useState<SearchState>(EMPTY);
  const [cidades, setCidades] = useState<string[]>([]);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [consulta, setConsulta] = useState<SearchState>(EMPTY);
  const [buscas, setBuscas] = useState<BuscaSalva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  async function load(next: SearchState, salvar = false) {
    setLoading(true);
    setError("");
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
        setError(data.error || "Não foi possível buscar as vagas.");
        setJobs([]);
        return;
      }
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      if (salvar) setBuscas(guardarBusca(next));
    } catch {
      setError("Não foi possível buscar as vagas.");
      setJobs([]);
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

  const opcoesEstado = ESTADOS.map((estado) => ({
    id: estado.uf,
    label: `${estado.uf} — ${estado.nome}`,
  }));
  const opcoesCidade = cidades.map((cidade) => ({ id: cidade, label: cidade }));
  const opcoesFaixa = FAIXAS_SALARIO.map((faixa) => ({ id: faixa.id, label: faixa.label }));

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>Buscar vagas</h2>
      <p className={styles.lead}>Todas as vagas publicadas no Recruta Indústria aparecem aqui, tanto as cadastradas pelo site quanto as das empresas. Use os filtros para ver só o que interessa. O nome de uma empresa confidencial não aparece.</p>
      <form
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault();
          void load(form, true);
        }}
      >
        <label className={styles.fieldWide}>
          Cargo ou palavra-chave
          <input className={styles.control} value={form.q} onChange={(event) => update("q", event.target.value)} maxLength={80} placeholder="Cargo ou palavra-chave" />
        </label>
        <ListaFlutuante
          label="Estado"
          value={form.estado}
          placeholder="UF"
          options={opcoesEstado}
          vazio="Nenhum estado encontrado."
          onChange={(uf) => setForm((current) => ({ ...current, estado: uf, cidade: "" }))}
        />
        <ListaFlutuante
          label="Cidade"
          value={form.cidade}
          placeholder={form.estado ? "Cidade" : "Escolha o estado"}
          options={opcoesCidade}
          vazio={form.estado ? (carregandoCidades ? "Carregando cidades..." : "Nenhuma cidade encontrada.") : "Escolha o estado para ver as cidades."}
          onChange={(cidade) => update("cidade", cidade)}
        />
        <label>
          Publicação
          <select className={styles.control} value={form.periodo} onChange={(event) => update("periodo", event.target.value)}>
            <option value="">Qualquer data</option>
            <option value="24h">Últimas 24 horas</option>
            <option value="7">Últimos 7 dias</option>
            <option value="15">Últimos 15 dias</option>
            <option value="30">Últimos 30 dias</option>
          </select>
        </label>
        <ListaFlutuante
          label="Salário"
          value={form.faixa}
          placeholder="Faixa"
          options={opcoesFaixa}
          vazio="Nenhuma faixa encontrada."
          onChange={(faixa) => update("faixa", faixa)}
        />
        <label>
          Contratação
          <select className={styles.control} value={form.contrato} onChange={(event) => update("contrato", event.target.value)}>
            <option value="">Todos</option>
            {CONTRACT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{contractOptionLabel(option.value, option.label)}</option>
            ))}
          </select>
        </label>
        <label>
          Modalidade
          <select className={styles.control} value={form.modalidade} onChange={(event) => update("modalidade", event.target.value)}>
            <option value="">Todas</option>
            {WORK_MODES.map((option) => (
              <option key={option.value} value={option.value}>{modeOptionLabel(option.value, option.label)}</option>
            ))}
          </select>
        </label>
        <div className={styles.actions}>
          <button type="submit">Buscar</button>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => {
              setForm(EMPTY);
              void load(EMPTY);
            }}
          >
            Limpar
          </button>
        </div>
      </form>

      {buscas.length > 0 ? (
        <div className={styles.history}>
          <p>Últimas buscas</p>
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
                {busca.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.lead}>Buscando vagas...</p> : null}
      {!loading && !error ? (
        <p className={styles.count}>
          {jobs.length === 1 ? "1 vaga publicada" : `${jobs.length} vagas publicadas`}
          {temFiltro(consulta) ? " com esses filtros" : ""}
        </p>
      ) : null}
      {!loading && !error && jobs.length === 0 ? (
        <p className={styles.empty}>
          {temFiltro(consulta) ? "Nenhuma vaga encontrada com esses filtros." : "Nenhuma vaga publicada no momento."}
        </p>
      ) : null}

      <div className={styles.list}>
        {jobs.map((job) => (
          <article key={job.id} className={styles.card}>
            <h3>{job.title}</h3>
            <p className={styles.company}>{job.companyLabel}</p>
            <ul>
              {job.publicationDate ? <li>{job.publicationDate}</li> : null}
              {job.salaryLabel ? <li>{job.salaryLabel}</li> : null}
              {job.contractLabel ? <li>{job.contractLabel}</li> : null}
              {job.workModeLabel ? <li>{job.workModeLabel}</li> : null}
              {job.workplace ? <li>{job.workplace}</li> : null}
            </ul>
            {job.description ? <p className={styles.excerpt}>{excerpt(job.description)}</p> : null}
            <JobCardActions job={job} />
          </article>
        ))}
      </div>
    </section>
  );
}
