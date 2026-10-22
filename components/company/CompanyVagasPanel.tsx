"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  APPLICATION_STAGES,
  CONTRACT_TYPES,
  WORK_MODES,
  applicationStageLabel,
  salaryInputFromCents,
  type AdminJob,
  type ApplicationMode,
  type ApplicationStage,
} from "@/lib/jobs/job-posting";
import ApplicationModeFields from "@/components/jobs/ApplicationModeFields";
import { facebookShareUrl, publicJobUrl, whatsAppShareUrl } from "@/lib/jobs/public-job-link";
import fields from "@/app/admin/vagas/vagas-admin.module.css";
import styles from "./company-vagas.module.css";

type Screen = "form" | "list" | "applications";

const ESTADOS: Array<{ uf: string; nome: string }> = [
  { uf: "AC", nome: "Acre" }, { uf: "AL", nome: "Alagoas" }, { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" }, { uf: "BA", nome: "Bahia" }, { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" }, { uf: "ES", nome: "Espírito Santo" }, { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" }, { uf: "MT", nome: "Mato Grosso" }, { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" }, { uf: "PA", nome: "Pará" }, { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" }, { uf: "PE", nome: "Pernambuco" }, { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" }, { uf: "RN", nome: "Rio Grande do Norte" }, { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" }, { uf: "RR", nome: "Roraima" }, { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" }, { uf: "SE", nome: "Sergipe" }, { uf: "TO", nome: "Tocantins" },
];

const FAIXAS_SALARIO: Array<{ id: string; label: string; minimo: string; negociavel: boolean }> = [
  { id: "1000-2000", label: "1.000,00 a 2.000,00", minimo: "1000", negociavel: false },
  { id: "2000-3000", label: "2.000,00 a 3.000,00", minimo: "2000", negociavel: false },
  { id: "3000-4000", label: "3.000,00 a 4.000,00", minimo: "3000", negociavel: false },
  { id: "4000-5000", label: "4.000,00 a 5.000,00", minimo: "4000", negociavel: false },
  { id: "acima-5000", label: "Acima de 5.000,00", minimo: "5000,01", negociavel: false },
  { id: "combinar", label: "A combinar", minimo: "", negociavel: true },
];

function reaisParaCentavos(value: string): number | null {
  const trimmed = value.trim().replace(/r\$/gi, "").replace(/\s/g, "");
  if (!trimmed) return null;
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed.replace(/\./g, "");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

function faixaIdDoSalario(salary: string, negotiable: boolean): string {
  if (negotiable) return "combinar";
  const cents = reaisParaCentavos(salary);
  if (cents == null) return "";
  if (cents > 500000) return "acima-5000";
  const faixa = [...FAIXAS_SALARIO].reverse().find((item) => {
    const minimo = reaisParaCentavos(item.minimo);
    return minimo != null && cents >= minimo && item.id !== "acima-5000" && item.id !== "combinar";
  });
  return faixa?.id || "";
}

function salarioDaFaixa(id: string): { salary: string; salaryNegotiable: boolean } {
  const faixa = FAIXAS_SALARIO.find((item) => item.id === id);
  if (!faixa || faixa.negociavel) return { salary: "", salaryNegotiable: Boolean(faixa?.negociavel) };
  const cents = reaisParaCentavos(faixa.minimo);
  return { salary: cents == null ? "" : salaryInputFromCents(cents), salaryNegotiable: false };
}

function localDoTexto(workplace: string): { estado: string; cidade: string } {
  const texto = workplace.trim();
  const match = texto.match(/^(.*)[\/,\-]\s*([A-Za-z]{2})$/);
  if (!match) {
    const uf = ESTADOS.find((item) => item.uf === texto.toUpperCase());
    return uf ? { estado: uf.uf, cidade: "" } : { estado: "", cidade: texto };
  }
  const uf = match[2].toUpperCase();
  return ESTADOS.some((item) => item.uf === uf)
    ? { estado: uf, cidade: match[1].trim() }
    : { estado: "", cidade: texto };
}

function textoDoLocal(estado: string, cidade: string): string {
  if (cidade && estado) return `${cidade}/${estado}`;
  return cidade || estado;
}

function ListaSuspensa({
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
  const [texto, setTexto] = useState("");
  const selecionada = options.find((item) => item.id === value);

  useEffect(() => {
    setTexto(selecionada?.label || "");
  }, [selecionada?.label]);

  useEffect(() => {
    if (!aberto) return;
    function fechar(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, [aberto]);

  const filtradas = useMemo(() => {
    const consulta = texto.trim().toLocaleLowerCase("pt-BR");
    if (!consulta || consulta === (selecionada?.label || "").toLocaleLowerCase("pt-BR")) return options;
    return options.filter((item) => item.label.toLocaleLowerCase("pt-BR").includes(consulta));
  }, [options, selecionada?.label, texto]);

  return (
    <label className={fields.field} ref={rootRef}>
      {label}
      <span className={styles.combo}>
        <input
          className={styles.comboControl}
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
            <path d="M1 1.5 L6 6.5 L11 1.5" fill="none" stroke="#000" strokeWidth="1.6" />
          </svg>
        </button>
        {aberto ? (
          <ul id={listId} className={styles.menu} role="listbox">
            {filtradas.length === 0 ? (
              <li>{vazio}</li>
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
      </span>
    </label>
  );
}

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
  workplace: string;
  description: string;
  observations: string;
  applicationMode: ApplicationMode;
  externalApplyUrl: string;
  applicationEmail: string;
};

type ApplicationRow = {
  id: string;
  name: string | null;
  email: string;
  profileId: string | null;
  profileTitle: string | null;
  stage: string;
  createdAt: string;
};

const COMPANY_RETURN_KEY = "ri-company-vagas-return";

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
    workplace: "",
    description: "",
    observations: "",
    applicationMode: "INTERNAL",
    externalApplyUrl: "",
    applicationEmail: "",
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
    workplace: job.workplace,
    description: job.description,
    observations: job.observations ?? "",
    applicationMode: job.applicationMode,
    externalApplyUrl: job.externalApplyUrl,
    applicationEmail: job.applicationEmail,
  };
}

function payloadFromJob(job: AdminJob, status: string) {
  return { ...formFromJob(job), salary: job.salaryNegotiable ? "" : job.salaryInput, status };
}

function statusLabel(status: string): string {
  if (status === "DRAFT") return "Rascunho";
  if (status === "PUBLISHED") return "Publicada";
  if (status === "UNPUBLISHED") return "Pausada";
  if (status === "CLOSED") return "Encerrada";
  return status;
}

function isStage(value: string): value is ApplicationStage {
  return APPLICATION_STAGES.some((item) => item.value === value);
}

export default function CompanyVagasPanel({
  apiBase = "/api/company/vagas",
  profilePath = (profileId: string) => `/company/professional/${encodeURIComponent(profileId)}`,
  returnKey = COMPANY_RETURN_KEY,
  showOrigin = false,
}: {
  apiBase?: string;
  profilePath?: ((profileId: string) => string) | null;
  returnKey?: string;
  showOrigin?: boolean;
} = {}) {
  const router = useRouter();
  const restored = useRef(false);
  const [companyName, setCompanyName] = useState("");
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(""));
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [faixaId, setFaixaId] = useState("");
  const [baseline, setBaseline] = useState("");
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selected = jobs.find((job) => job.id === selectedId) ?? null;
  const draftCount = jobs.filter((job) => job.status === "DRAFT").length;
  const dirty = screen === "form" && baseline !== "" && JSON.stringify(form) !== baseline;

  const rememberForm = useCallback((next: FormState) => {
    setForm(next);
    setBaseline(JSON.stringify(next));
    const local = localDoTexto(next.workplace);
    setEstado(local.estado);
    setCidade(local.cidade);
    setFaixaId(faixaIdDoSalario(next.salary, next.salaryNegotiable));
  }, []);

  const loadApplications = useCallback(async (jobId: string) => {
    setLoadingApplications(true);
    const response = await fetch(`${apiBase}/${jobId}/candidaturas`, { credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Não foi possível carregar as candidaturas.");
    }
    setApplications(data.applications || []);
  }, [apiBase]);

  useEffect(() => {
    if (!estado) {
      setCidades([]);
      return;
    }
    let ativo = true;
    setCarregandoCidades(true);
    void fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`)
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
  }, [estado]);

  useEffect(() => {
    void fetch(apiBase, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Não foi possível carregar as vagas.");
        const name = String(data.companyName || "");
        setCompanyName(name);
        setJobs(data.jobs || []);
        rememberForm(emptyForm(name));
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as vagas.");
      })
      .finally(() => setLoading(false));
  }, [apiBase, rememberForm]);

  useEffect(() => {
    if (loading || restored.current) return;
    restored.current = true;
    let memory: { screen?: string; jobId?: string; query?: string } | null = null;
    try {
      const raw = sessionStorage.getItem(returnKey);
      if (raw) memory = JSON.parse(raw) as { screen?: string; jobId?: string; query?: string };
    } catch {
      memory = null;
    }
    sessionStorage.removeItem(returnKey);

    if (memory?.screen === "applications" && memory.jobId && jobs.some((job) => job.id === memory?.jobId)) {
      setSelectedId(memory.jobId);
      setCandidateQuery(memory.query || "");
      setScreen("applications");
      void loadApplications(memory.jobId).catch((loadError) => {
        setApplications([]);
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as candidaturas.");
      }).finally(() => setLoadingApplications(false));
      return;
    }
    setScreen("list");
  }, [jobs, loadApplications, loading, returnKey]);

  function confirmLeave(): boolean {
    if (!dirty) return true;
    return window.confirm("Há alterações não salvas. Deseja sair sem salvar?");
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openNew() {
    if (!confirmLeave()) return;
    setSelectedId(null);
    rememberForm(emptyForm(companyName));
    setApplications([]);
    setMessage("");
    setError("");
    setScreen("form");
  }

  function openList() {
    if (!confirmLeave()) return;
    setMessage("");
    setError("");
    setScreen("list");
  }

  function editJob(job: AdminJob) {
    if (!confirmLeave()) return;
    setSelectedId(job.id);
    rememberForm(formFromJob(job));
    setMessage("");
    setError("");
    setScreen("form");
  }

  async function openApplications(job: AdminJob) {
    if (!confirmLeave()) return;
    setSelectedId(job.id);
    setScreen("applications");
    setMessage("");
    setError("");
    setApplications([]);
    try {
      await loadApplications(job.id);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as candidaturas.");
    } finally {
      setLoadingApplications(false);
    }
  }

  function keptStatus(): string {
    if (selected?.status === "PUBLISHED" || selected?.status === "UNPUBLISHED" || selected?.status === "CLOSED") {
      return selected.status;
    }
    return "DRAFT";
  }

  async function save(status: string, nextScreen: Screen = "form") {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(selectedId ? `${apiBase}/${selectedId}` : apiBase, {
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
      rememberForm(formFromJob(job));
      setMessage(status === "PUBLISHED" ? "Vaga publicada." : status === "DRAFT" ? "Rascunho salvo." : "Vaga salva.");
      if (nextScreen === "list") setScreen("list");
    } catch {
      setError("Não foi possível salvar a vaga.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(job: AdminJob, status: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${apiBase}/${job.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromJob(job, status)),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.job) {
        setError(data.error || "Não foi possível atualizar a vaga.");
        return;
      }
      const saved = data.job as AdminJob;
      setJobs((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      setMessage(status === "PUBLISHED" ? "Vaga reativada." : status === "UNPUBLISHED" ? "Vaga pausada." : "Vaga encerrada.");
    } catch {
      setError("Não foi possível atualizar a vaga.");
    } finally {
      setBusy(false);
    }
  }

  async function removeJob(job: AdminJob) {
    if (busy) return;
    const confirmed = window.confirm("Excluir esta vaga? Esta ação não pode ser desfeita.");
    if (!confirmed) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${apiBase}/${job.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Não foi possível excluir a vaga.");
        return;
      }
      setJobs((current) => current.filter((item) => item.id !== job.id));
      if (selectedId === job.id) setSelectedId(null);
      setMessage("Vaga excluída.");
    } catch {
      setError("Não foi possível excluir a vaga.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStage(application: ApplicationRow, stage: string) {
    if (!selectedId || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/${selectedId}/candidaturas/${application.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.application?.stage !== stage) {
        setError(data.error || "Não foi possível atualizar a etapa.");
        return;
      }
      setApplications((current) => current.map((item) => (
        item.id === application.id ? { ...item, stage } : item
      )));
    } catch {
      setError("Não foi possível atualizar a etapa.");
    } finally {
      setBusy(false);
    }
  }

  function openProfile(application: ApplicationRow) {
    if (!profilePath || !application.profileId || !selectedId) return;
    sessionStorage.setItem(returnKey, JSON.stringify({
      screen: "applications",
      jobId: selectedId,
      query: candidateQuery,
    }));
    router.push(profilePath(application.profileId));
  }

  const visibleApplications = applications.filter((application) => {
    const query = candidateQuery.trim().toLocaleLowerCase("pt-BR");
    if (!query) return true;
    return (application.name || "").toLocaleLowerCase("pt-BR").includes(query);
  });

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Publicar vagas</h1>
        <p className={styles.subtitle}>Cadastre, divulgue e acompanhe suas oportunidades em um só lugar.</p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span>Total de vagas</span>
            <strong>{jobs.length}</strong>
          </div>
          <div className={styles.stat}>
            <span>Em rascunho</span>
            <strong>{draftCount}</strong>
          </div>
        </div>
        <div className={styles.tabs} role="tablist" aria-label="Publicação de vagas">
          <button type="button" className={`${styles.tab} ${screen !== "form" ? styles.tabOn : ""}`} onClick={openList}>
            Vagas publicadas ({jobs.length})
          </button>
          <button type="button" className={`${styles.tab} ${screen === "form" ? styles.tabOn : ""}`} onClick={openNew}>
            + Nova vaga
          </button>
        </div>
        {error ? <p className={styles.bad} role="alert">{error}</p> : null}
        {message ? <p className={styles.ok} role="status">{message}</p> : null}
      </div>

      {loading || screen === null ? <p className={styles.cardText}>Carregando vagas...</p> : null}

      {screen === "form" ? (
        <form className={styles.card} onSubmit={(event) => event.preventDefault()}>
          <h2 className={styles.cardTitle}>{selected ? "Editar vaga" : "Cadastrar oportunidade"}</h2>
          <p className={styles.cardText}>
            {selected ? `${statusLabel(selected.status)}. O identificador desta vaga permanece o mesmo.` : "Preencha os dados para divulgar sua vaga."}
          </p>
          <div className={styles.grid}>
            <label className={fields.field}>
              Nome da empresa
              <input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} maxLength={160} />
            </label>
            <label className={fields.field}>
              Data da vaga
              <input type="date" value={form.publicationDate} onChange={(event) => update("publicationDate", event.target.value)} />
              <span className={fields.help}>Data de publicação. Não é a data de encerramento.</span>
            </label>
            <fieldset className={`${fields.field} ${styles.span}`}>
              <legend>Como deseja divulgar esta vaga?</legend>
              <div className={fields.choices} role="radiogroup" aria-label="Como deseja divulgar esta vaga?">
                <button type="button" className={`${fields.choice} ${form.confidential ? "" : fields.choiceOn}`} aria-pressed={!form.confidential} onClick={() => update("confidential", false)}>
                  Publicar com o nome da empresa
                </button>
                <button type="button" className={`${fields.choice} ${form.confidential ? fields.choiceOn : ""}`} aria-pressed={form.confidential} onClick={() => update("confidential", true)}>
                  Publicar anonimamente
                </button>
              </div>
            </fieldset>
            <p className={`${fields.help} ${styles.span}`}>
              {form.confidential
                ? "Na página pública e no compartilhamento aparece somente “Empresa confidencial”. O nome real continua salvo aqui."
                : "O nome da empresa aparece na página pública. E-mail, telefone e documentos não são divulgados."}
            </p>
            <label className={fields.field}>
              Cargo
              <input value={form.title} onChange={(event) => update("title", event.target.value)} maxLength={160} placeholder="Ex.: Operador CNC" />
            </label>
            <ListaSuspensa
              label="Salário"
              value={faixaId}
              placeholder="Faixa"
              options={FAIXAS_SALARIO.map((faixa) => ({ id: faixa.id, label: faixa.label }))}
              vazio="Nenhuma faixa encontrada."
              onChange={(id) => {
                setFaixaId(id);
                const salario = salarioDaFaixa(id);
                setForm((current) => ({ ...current, ...salario }));
              }}
            />
            <ListaSuspensa
              label="Estado"
              value={estado}
              placeholder="UF"
              options={ESTADOS.map((item) => ({ id: item.uf, label: `${item.uf} — ${item.nome}` }))}
              vazio="Nenhum estado encontrado."
              onChange={(uf) => {
                setEstado(uf);
                setCidade("");
                setForm((current) => ({ ...current, workplace: textoDoLocal(uf, "") }));
              }}
            />
            <ListaSuspensa
              label="Cidade"
              value={cidade}
              placeholder={estado ? "Cidade" : "Escolha o estado"}
              options={cidades.map((nome) => ({ id: nome, label: nome }))}
              vazio={estado ? (carregandoCidades ? "Carregando cidades..." : "Nenhuma cidade encontrada.") : "Escolha o estado para ver as cidades."}
              onChange={(nome) => {
                setCidade(nome);
                setForm((current) => ({ ...current, workplace: textoDoLocal(estado, nome) }));
              }}
            />
            <div className={styles.span}>
              <fieldset className={fields.field}>
                <legend>Tipo de contratação</legend>
                <div className={fields.choices} role="radiogroup" aria-label="Tipo de contratação">
                  {CONTRACT_TYPES.map((option) => (
                    <button key={option.value} type="button" className={`${fields.choice} ${form.contractType === option.value ? fields.choiceOn : ""}`} aria-pressed={form.contractType === option.value} onClick={() => update("contractType", option.value)}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              {form.contractType === "OUTRO" ? (
                <label className={fields.field}>
                  Qual tipo de contratação?
                  <input value={form.contractTypeOther} onChange={(event) => update("contractTypeOther", event.target.value)} maxLength={80} />
                </label>
              ) : null}
              <fieldset className={fields.field}>
                <legend>Modalidade</legend>
                <div className={fields.choices} role="radiogroup" aria-label="Modalidade de trabalho">
                  {WORK_MODES.map((option) => (
                    <button key={option.value} type="button" className={`${fields.choice} ${form.workMode === option.value ? fields.choiceOn : ""}`} aria-pressed={form.workMode === option.value} onClick={() => update("workMode", option.value)}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className={fields.field}>
                Descrição da vaga
                <textarea value={form.description} onChange={(event) => update("description", event.target.value)} maxLength={8000} />
              </label>
              <label className={fields.field}>
                Observações
                <textarea value={form.observations} onChange={(event) => update("observations", event.target.value)} maxLength={4000} placeholder="Opcional." />
              </label>
              <ApplicationModeFields
                mode={form.applicationMode}
                url={form.externalApplyUrl}
                email={form.applicationEmail}
                onMode={(mode) => update("applicationMode", mode)}
                onUrl={(value) => update("externalApplyUrl", value)}
                onEmail={(value) => update("applicationEmail", value)}
              />
            </div>
          </div>
          <div className={styles.actions}>
            {selected && selected.status !== "DRAFT" ? (
              <button type="button" className={styles.ghost} disabled={busy} onClick={() => void save(selected.status, "list")}>
                Salvar alterações
              </button>
            ) : (
              <button type="button" className={styles.ghost} disabled={busy} onClick={() => void save("DRAFT")}>
                Salvar rascunho
              </button>
            )}
            {selected?.status !== "PUBLISHED" ? (
              <button type="button" disabled={busy} onClick={() => void save("PUBLISHED", "list")}>
                Publicar vaga
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {screen === "list" && jobs.length > 0 ? (
        <div className={styles.rows}>
              {jobs.map((job) => (
                <article key={job.id} className={styles.row}>
                  <div>
                    <h2 className={styles.jobTitle}>
                      {job.title}
                      <span className={styles.badge}>{statusLabel(job.status)}</span>
                    </h2>
                    <p className={styles.meta}>
                      {showOrigin
                        ? `${job.companyName || "Sem empresa"} · ${job.confidential ? "Anônima" : "Identificada"} · ${job.originLabel}`
                        : (job.confidential ? "Vaga confidencial" : (job.companyName || "Empresa"))}
                      {job.contractLabel ? ` · ${job.contractLabel}` : ""}
                      {job.workModeLabel ? ` · ${job.workModeLabel}` : ""}
                      {job.workplace ? ` · ${job.workplace}` : ""}
                    </p>
                    <p className={styles.meta}>
                      {job.publicationDate ? `Publicada em ${job.publicationDate}` : "Sem data de publicação"}
                      {` · Candidaturas: ${job.applicationCount}`}
                    </p>
                  </div>
                  <div className={styles.rowActions}>
                    <button type="button" className={styles.ghost} onClick={() => void openApplications(job)}>Candidaturas</button>
                    {job.status === "PUBLISHED" ? (
                      <a className={styles.ghost} href={`/vagas/${job.id}`} target="_blank" rel="noopener noreferrer">Ver vaga</a>
                    ) : (
                      <button type="button" className={styles.ghost} disabled title="A vaga não está na divulgação pública.">Ver vaga</button>
                    )}
                    <button type="button" className={styles.ghost} onClick={() => editJob(job)}>Editar</button>
                    {job.status === "PUBLISHED" ? (
                      <button
                        type="button"
                        className={styles.ghost}
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm("Deseja pausar esta vaga? A oportunidade deixará de receber novas candidaturas enquanto estiver pausada.")) {
                            void changeStatus(job, "UNPUBLISHED");
                          }
                        }}
                      >
                        Pausar vaga
                      </button>
                    ) : null}
                    {job.status === "UNPUBLISHED" ? (
                      <button type="button" className={styles.ghost} disabled={busy} onClick={() => void changeStatus(job, "PUBLISHED")}>
                        Reativar vaga
                      </button>
                    ) : null}
                    {job.status === "PUBLISHED" || job.status === "UNPUBLISHED" ? (
                      <button
                        type="button"
                        className={styles.ghost}
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm("Encerrar esta vaga? Ela deixará de receber candidaturas e sairá da lista pública. Os candidatos já registrados permanecem.")) {
                            void changeStatus(job, "CLOSED");
                          }
                        }}
                      >
                        Encerrar vaga
                      </button>
                    ) : null}
                    {showOrigin && job.status === "PUBLISHED" ? (
                      <details className={styles.more}>
                        <summary>Compartilhar vaga</summary>
                        <div className={`${styles.moreMenu} ${styles.shareMenu}`}>
                          <button
                            type="button"
                            className={styles.ghost}
                            onClick={() => {
                              const url = publicJobUrl(job.id);
                              if (!navigator.clipboard?.writeText) {
                                setError("Não foi possível copiar o link da vaga.");
                                return;
                              }
                              void navigator.clipboard.writeText(url).then(
                                () => {
                                  setError("");
                                  setMessage("Link da vaga copiado com sucesso");
                                },
                                () => setError("Não foi possível copiar o link da vaga."),
                              );
                            }}
                          >
                            Copiar link da vaga
                          </button>
                          <a className={styles.ghost} href={facebookShareUrl(job.id)} target="_blank" rel="noopener noreferrer">
                            Compartilhar no Facebook
                          </a>
                          <a className={styles.ghost} href={whatsAppShareUrl(job.title, job.id)} target="_blank" rel="noopener noreferrer">
                            Compartilhar no WhatsApp
                          </a>
                          <a className={styles.ghost} href={publicJobUrl(job.id)} target="_blank" rel="noopener noreferrer">
                            Visualizar página pública
                          </a>
                        </div>
                      </details>
                    ) : null}
                    <details className={styles.more}>
                      <summary>Mais</summary>
                      <div className={styles.moreMenu}>
                        <button type="button" className={styles.danger} disabled={busy} onClick={() => void removeJob(job)}>
                          Excluir
                        </button>
                      </div>
                    </details>
                  </div>
                </article>
              ))}
        </div>
      ) : null}

      {screen === "applications" && selected ? (
        <div className={styles.card}>
          <button type="button" className={`${styles.ghost} ${styles.back}`} onClick={openList}>
            Voltar às vagas
          </button>
          <h2 className={styles.cardTitle}>Candidaturas · {selected.title}</h2>
          <p className={styles.cardText}>{statusLabel(selected.status)} · {selected.applicationCount} candidatura{selected.applicationCount === 1 ? "" : "s"}</p>
          <label className={fields.field}>
            Filtrar por nome
            <input className={styles.filter} value={candidateQuery} onChange={(event) => setCandidateQuery(event.target.value)} placeholder="Nome do candidato" />
          </label>
          {loadingApplications ? <p className={styles.cardText}>Carregando candidaturas...</p> : null}
          {!loadingApplications && applications.length === 0 ? (
            <p className={styles.empty}>Ainda não há candidatos para esta vaga.</p>
          ) : null}
          {!loadingApplications && applications.length > 0 && visibleApplications.length === 0 ? (
            <p className={styles.empty}>Nenhum candidato com esse nome.</p>
          ) : null}
          {visibleApplications.map((application) => {
            const stage = isStage(application.stage) ? application.stage : "NEW";
            return (
              <div key={application.id} className={styles.candidate}>
                <div>
                  {profilePath && application.profileId ? (
                    <button type="button" className={styles.name} onClick={() => openProfile(application)}>
                      {application.name || "Nome não informado"}
                    </button>
                  ) : (
                    <span className={styles.plainName}>{application.name || "Nome não informado"}</span>
                  )}
                  <span className={styles.stage}>{applicationStageLabel(stage)}</span>
                </div>
                <label className={styles.candidateActions}>
                  <span className={styles.stage}>Etapa</span>
                  <select
                    className={styles.stageSelect}
                    value={stage}
                    disabled={busy}
                    aria-label={`Etapa de ${application.name || "candidato"}`}
                    onChange={(event) => void changeStage(application, event.target.value)}
                  >
                    {APPLICATION_STAGES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
