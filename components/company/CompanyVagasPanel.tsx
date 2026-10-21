"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CONTRACT_TYPES, WORK_MODES, type AdminJob } from "@/lib/jobs/job-posting";
import styles from "@/app/admin/vagas/vagas-admin.module.css";

type FormState = {
  companyName: string;
  confidential: boolean;
  publicationDate: string;
  title: string;
  salary: string;
  salaryNegotiable: boolean;
  contractType: string;
  contractTypeOther: string;
  workMode: string;
  description: string;
  observations: string;
  applicationInstructions: string;
};

type ApplicationRow = {
  id: string;
  name: string | null;
  email: string;
  profileTitle: string | null;
  createdAt: string;
};

function emptyForm(companyName: string): FormState {
  return {
    companyName,
    confidential: false,
    publicationDate: "",
    title: "",
    salary: "",
    salaryNegotiable: false,
    contractType: "",
    contractTypeOther: "",
    workMode: "",
    description: "",
    observations: "",
    applicationInstructions: "",
  };
}

function formFromJob(job: AdminJob): FormState {
  return {
    companyName: job.companyName,
    confidential: job.confidential,
    publicationDate: job.publicationDateInput,
    title: job.title,
    salary: job.salaryInput,
    salaryNegotiable: job.salaryNegotiable,
    contractType: job.contractType,
    contractTypeOther: job.contractTypeOther,
    workMode: job.workMode,
    description: job.description,
    observations: job.observations ?? "",
    applicationInstructions: job.applicationInstructions ?? "",
  };
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CompanyVagasPanel() {
  const [companyName, setCompanyName] = useState("");
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(""));
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selected = jobs.find((job) => job.id === selectedId) ?? null;

  const loadApplications = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/company/vagas/${jobId}/candidaturas`, { credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Não foi possível carregar as candidaturas.");
    }
    setApplications(data.applications || []);
  }, []);

  useEffect(() => {
    void fetch("/api/company/vagas", { credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Não foi possível carregar as vagas.");
        const name = String(data.companyName || "");
        setCompanyName(name);
        setJobs(data.jobs || []);
        setForm(emptyForm(name));
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as vagas.");
      })
      .finally(() => setLoading(false));
  }, []);

  function selectJob(job: AdminJob) {
    setSelectedId(job.id);
    setForm(formFromJob(job));
    setMessage("");
    setError("");
    void loadApplications(job.id).catch((loadError) => {
      setApplications([]);
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as candidaturas.");
    });
  }

  function startNew() {
    setSelectedId(null);
    setForm(emptyForm(companyName));
    setApplications([]);
    setMessage("");
    setError("");
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function keptStatus(): string {
    if (selected?.status === "PUBLISHED" || selected?.status === "UNPUBLISHED" || selected?.status === "CLOSED") {
      return selected.status;
    }
    return "DRAFT";
  }

  async function save(status: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(selectedId ? `/api/company/vagas/${selectedId}` : "/api/company/vagas", {
        method: selectedId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salary: form.salaryNegotiable ? "" : form.salary,
          status,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.job) {
        setError(data.error || "Não foi possível salvar a vaga.");
        return;
      }
      const job = data.job as AdminJob;
      setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      setSelectedId(job.id);
      setForm(formFromJob(job));
      setMessage(status === "PUBLISHED" ? "Vaga salva e publicada." : "Vaga salva.");
      await loadApplications(job.id);
    } catch {
      setError("Não foi possível salvar a vaga.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ padding: "8px 12px 24px" }}>
      <h1 style={{ margin: "0 0 6px", color: "#c89b3c", fontSize: 28 }}>Publicar vagas</h1>
      <p style={{ margin: "0 0 16px", color: "#d6d6d6", fontSize: 14 }}>
        Cadastre a vaga da sua empresa, publique e acompanhe as candidaturas.
      </p>
      {loading ? <p>Carregando vagas...</p> : null}
      {error ? <p className={styles.bad}>{error}</p> : null}
      {message ? <p className={styles.ok}>{message}</p> : null}

      <div className={styles.layout}>
        <section className={styles.list}>
          <h2 className={styles.listTitle}>Cadastradas</h2>
          <button type="button" className={styles.newButton} onClick={startNew}>Nova vaga</button>
          {jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              className={`${styles.jobButton} ${job.id === selectedId ? styles.jobButtonActive : ""}`}
              onClick={() => selectJob(job)}
            >
              <strong>{job.title}</strong>
              <span className={styles.jobMeta}>
                {job.statusLabel} · {job.applicationCount} candidatura{job.applicationCount === 1 ? "" : "s"}
              </span>
            </button>
          ))}
          {!loading && jobs.length === 0 ? <p className={styles.help}>Nenhuma vaga cadastrada ainda.</p> : null}
        </section>

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void save(keptStatus());
          }}
        >
          <h2 className={styles.formTitle}>{selected ? "Editar vaga" : "Nova vaga"}</h2>
          {selected ? (
            <p className={styles.status}>
              {selected.statusLabel}
              {selected.publicPath ? (
                <>
                  {" "}
                  · <Link className={styles.publicLink} href={selected.publicPath}>Abrir página pública</Link>
                </>
              ) : null}
            </p>
          ) : null}

          <label className={styles.field}>
            Nome da empresa
            <input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} maxLength={160} />
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={form.confidential} onChange={(event) => update("confidential", event.target.checked)} />
            Vaga confidencial
          </label>
          <p className={styles.help}>
            Com essa opção, a página pública mostra apenas “Empresa confidencial”. O nome informado continua salvo aqui.
          </p>

          <label className={styles.field}>
            Data da vaga
            <input type="date" value={form.publicationDate} onChange={(event) => update("publicationDate", event.target.value)} />
            <span className={styles.help}>Data de publicação ou divulgação. Não é a data de encerramento.</span>
          </label>
          <label className={styles.field}>
            Cargo
            <input value={form.title} onChange={(event) => update("title", event.target.value)} required maxLength={160} placeholder="Ex.: Auxiliar de Produção" />
          </label>
          <label className={styles.field}>
            Salário
            <input value={form.salary} onChange={(event) => update("salary", event.target.value)} disabled={form.salaryNegotiable} inputMode="decimal" placeholder="Ex.: 3500 ou 3.500,00" />
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={form.salaryNegotiable} onChange={(event) => update("salaryNegotiable", event.target.checked)} />
            A combinar
          </label>

          <fieldset className={styles.field}>
            <legend>Tipo de contratação</legend>
            <div className={styles.choices} role="radiogroup" aria-label="Tipo de contratação">
              {CONTRACT_TYPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.choice} ${form.contractType === option.value ? styles.choiceOn : ""}`}
                  aria-pressed={form.contractType === option.value}
                  onClick={() => update("contractType", option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
          {form.contractType === "OUTRO" ? (
            <label className={styles.field}>
              Qual tipo de contratação?
              <input value={form.contractTypeOther} onChange={(event) => update("contractTypeOther", event.target.value)} maxLength={80} />
            </label>
          ) : null}

          <fieldset className={styles.field}>
            <legend>Modalidade de trabalho</legend>
            <div className={styles.choices} role="radiogroup" aria-label="Modalidade de trabalho">
              {WORK_MODES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.choice} ${form.workMode === option.value ? styles.choiceOn : ""}`}
                  aria-pressed={form.workMode === option.value}
                  onClick={() => update("workMode", option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className={styles.field}>
            Descrição da vaga
            <textarea value={form.description} onChange={(event) => update("description", event.target.value)} maxLength={8000} />
          </label>
          <label className={styles.field}>
            Observações
            <textarea value={form.observations} onChange={(event) => update("observations", event.target.value)} maxLength={4000} placeholder="E-mail, documentos ou instruções. Opcional." />
          </label>
          <label className={styles.field}>
            Como se candidatar
            <textarea value={form.applicationInstructions} onChange={(event) => update("applicationInstructions", event.target.value)} maxLength={2000} placeholder="Ex.: Candidate-se pelo Recruta Indústria." />
          </label>

          <div className={styles.actions}>
            {selected?.status === "PUBLISHED" || selected?.status === "UNPUBLISHED" || selected?.status === "CLOSED" ? (
              <button type="button" disabled={busy} onClick={() => void save(selected.status)}>Salvar alterações</button>
            ) : (
              <button type="button" disabled={busy} onClick={() => void save("DRAFT")}>Salvar rascunho</button>
            )}
            {selected?.status !== "PUBLISHED" ? (
              <button type="button" disabled={busy} onClick={() => void save("PUBLISHED")}>Publicar</button>
            ) : null}
            {selected?.status === "PUBLISHED" ? (
              <button type="button" disabled={busy} onClick={() => void save("UNPUBLISHED")}>Despublicar</button>
            ) : null}
            {selected && selected.status !== "CLOSED" && selected.status !== "DRAFT" ? (
              <button type="button" disabled={busy} onClick={() => void save("CLOSED")}>Encerrar</button>
            ) : null}
          </div>
        </form>

        <section className={styles.applications}>
          <h2 className={styles.formTitle}>Candidaturas</h2>
          {!selected ? <p className={styles.help}>Selecione uma vaga para ver quem se candidatou.</p> : null}
          {selected && applications.length === 0 ? <p className={styles.help}>Nenhuma candidatura registrada nesta vaga.</p> : null}
          {applications.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Profissional</th>
                    <th>E-mail</th>
                    <th>Cargo no perfil</th>
                    <th>Registrada em</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td>{application.name || "Nome não informado"}</td>
                      <td>{application.email}</td>
                      <td>{application.profileTitle || "—"}</td>
                      <td>{formatWhen(application.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
