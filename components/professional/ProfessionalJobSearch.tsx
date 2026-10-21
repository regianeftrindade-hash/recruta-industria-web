"use client";

import { useEffect, useState } from "react";
import { CONTRACT_TYPES, WORK_MODES, type PublicJob } from "@/lib/jobs/job-posting";
import styles from "./professional-job-search.module.css";

type SearchState = {
  q: string;
  contrato: string;
  modalidade: string;
  local: string;
  salario: string;
  de: string;
  ate: string;
};

const EMPTY: SearchState = {
  q: "",
  contrato: "",
  modalidade: "",
  local: "",
  salario: "",
  de: "",
  ate: "",
};

function excerpt(value: string): string {
  const plain = value.replace(/\s+/g, " ").trim();
  if (plain.length <= 140) return plain;
  return `${plain.slice(0, 137).trimEnd()}...`;
}

export default function ProfessionalJobSearch() {
  const [form, setForm] = useState<SearchState>(EMPTY);
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(next: SearchState) {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.contrato) params.set("contrato", next.contrato);
    if (next.modalidade) params.set("modalidade", next.modalidade);
    if (next.local.trim()) params.set("local", next.local.trim());
    if (next.salario) params.set("salario", next.salario);
    if (next.de) params.set("de", next.de);
    if (next.ate) params.set("ate", next.ate);

    try {
      const response = await fetch(`/api/vagas?${params.toString()}`, { credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Não foi possível buscar as vagas.");
        setJobs([]);
        return;
      }
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
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

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>Buscar vagas</h2>
      <p className={styles.lead}>Vagas publicadas no Recruta Indústria. O nome de uma empresa confidencial não aparece nesta busca.</p>
      <form
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault();
          void load(form);
        }}
      >
        <label className={styles.fieldWide}>
          Cargo, descrição ou empresa
          <input value={form.q} onChange={(event) => update("q", event.target.value)} maxLength={80} placeholder="Ex.: soldador, Joinville, CLT" />
        </label>
        <label>
          Contratação
          <select value={form.contrato} onChange={(event) => update("contrato", event.target.value)}>
            <option value="">Todas</option>
            {CONTRACT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          Modalidade
          <select value={form.modalidade} onChange={(event) => update("modalidade", event.target.value)}>
            <option value="">Todas</option>
            {WORK_MODES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          Local
          <input value={form.local} onChange={(event) => update("local", event.target.value)} maxLength={120} placeholder="Cidade / UF" />
        </label>
        <label>
          Salário
          <select value={form.salario} onChange={(event) => update("salario", event.target.value)}>
            <option value="">Todos</option>
            <option value="negociavel">A combinar</option>
            <option value="informado">Com valor informado</option>
          </select>
        </label>
        <label>
          Publicada de
          <input type="date" value={form.de} onChange={(event) => update("de", event.target.value)} />
        </label>
        <label>
          Publicada até
          <input type="date" value={form.ate} onChange={(event) => update("ate", event.target.value)} />
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

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.lead}>Buscando vagas...</p> : null}
      {!loading && !error ? (
        <p className={styles.count}>{jobs.length === 1 ? "1 vaga" : `${jobs.length} vagas`}</p>
      ) : null}
      {!loading && !error && jobs.length === 0 ? (
        <p className={styles.empty}>Nenhuma vaga encontrada com esses filtros.</p>
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
            <a href={`/vagas/${job.id}`}>Ver vaga</a>
          </article>
        ))}
      </div>
    </section>
  );
}
