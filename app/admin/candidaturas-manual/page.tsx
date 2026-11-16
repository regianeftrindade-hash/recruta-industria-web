"use client";
import { localizeServerText } from "@/lib/i18n/server-text";
import { exactUi } from "@/lib/i18n/exact-ui";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n/translate";
import styles from "../admin.module.css";

function caixaEmailHref(email: string, extra?: {
  assunto?: string;
  nome?: string;
  cargo?: string;
  vaga?: string;
  candidatura?: string;
  cuidados?: string;
}): string {
  const query = new URLSearchParams();
  query.set("para", email);
  if (extra?.assunto) query.set("assunto", extra.assunto);
  if (extra?.nome) query.set("nome", extra.nome);
  if (extra?.cargo) query.set("cargo", extra.cargo);
  if (extra?.vaga) query.set("vaga", extra.vaga);
  if (extra?.candidatura) query.set("candidatura", extra.candidatura);
  if (extra?.cuidados) query.set("cuidados", extra.cuidados);
  return `/admin/contato?${query.toString()}`;
}

type ManualApplication = {
  id: string;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  whatsappHref: string | null;
  resumeLabel: string | null;
};

type ManualJob = {
  id: string;
  title: string;
  companyName: string;
  workplace: string | null;
  publicationDate: string | null;
  salaryLabel: string | null;
  applicationEmail: string | null;
  applicationWhatsapp: string | null;
  applicationWhatsappHref: string | null;
  careOf: string | null;
  subject: string;
  deadline: string | null;
  description: string;
  deliveryText: string;
  shareUrl: string;
  shareText: string;
  applicationCount: number;
  applications: ManualApplication[];
};

function hojeSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

type NovaVaga = {
  title: string;
  companyName: string;
  workplace: string;
  salary: string;
  salaryNegotiable: boolean;
  description: string;
  applicationEmail: string;
  applicationWhatsapp: string;
  careOf: string;
  subject: string;
  deadline: string;
  publicationDate: string;
};

function vagaEmBranco(): NovaVaga {
  return {
    title: "",
    companyName: "",
    workplace: "",
    salary: "",
    salaryNegotiable: false,
    description: "",
    applicationEmail: "",
    applicationWhatsapp: "",
    careOf: "Maria",
    subject: "",
    deadline: "",
    publicationDate: hojeSaoPaulo(),
  };
}

function vagaResumo(job: ManualJob): string {
  return [
    job.companyName,
    job.workplace,
    job.salaryLabel,
    job.publicationDate ? `Publicada em ${job.publicationDate}` : null,
  ].filter(Boolean).join(" · ");
}

export default function CandidaturasManuaisPage() {
  const [jobs, setJobs] = useState<ManualJob[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NovaVaga>(vagaEmBranco);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/candidaturas-manual", { credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(localizeServerText(body.error) || exactUi("Não foi possível carregar as vagas."));
      setJobs(Array.isArray(body.jobs) ? body.jobs : []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : exactUi("Não foi possível carregar as vagas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openJob = jobs.find((job) => job.id === openId) ?? null;

  function updateForm<K extends keyof NovaVaga>(key: K, value: NovaVaga[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function publishJob() {
    setSaving(true);
    setFormError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/candidaturas-manual", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(localizeServerText(body.error) || exactUi("Não foi possível cadastrar a vaga."));
      setCreating(false);
      setForm(vagaEmBranco());
      setNotice(exactUi("Vaga cadastrada. Ela já aparece nesta lista e no site."));
      await load();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : exactUi("Não foi possível cadastrar a vaga."));
    } finally {
      setSaving(false);
    }
  }

  async function copyValue(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(key);
      window.setTimeout(() => setCopiedId((current) => (current === key ? "" : current)), 2000);
    } catch {
      setCopiedId("");
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>{t("internal.admin.manualTitle")}</h1>
          <p className={styles.heroMeta}>
            Abra a vaga para ver a descrição, o envio aos cuidados de quem recebe, o link para compartilhar e os currículos em PDF.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnGold}
            onClick={() => {
              setOpenId(null);
              setFormError("");
              setCreating((open) => !open);
            }}
          >
            {creating ? exactUi("Fechar cadastro") : exactUi("Cadastrar vaga")}
          </button>
          <button type="button" className={styles.btnGold} onClick={() => void load()}>{exactUi("Atualizar")}</button>
        </div>
      </div>

      {loading ? <p className={styles.empty}>{t("internal.company.loadingJobs")}</p> : null}
      {error ? <div className={styles.errorBox}>{error}</div> : null}
      {notice ? <p className={styles.panelSub}>{notice}</p> : null}

      {creating && !openJob ? (
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2 className={styles.panelTitle}>{t("rest.admin.manualNew")}</h2>
              <p className={styles.panelSub}>
                A vaga entra no site. A pessoa se candidata por lá e o currículo fica nesta aba para você enviar.
              </p>
            </div>
          </div>
          <div className={styles.manualForm}>
            <label className={styles.manualField}>
              <span className={styles.replyLabel}>{t("rest.admin.role")}</span>
              <input className={styles.replyInput} value={form.title} maxLength={160} onChange={(event) => updateForm("title", event.target.value)} />
            </label>
            <label className={styles.manualField}>
              <span className={styles.replyLabel}>{t("internal.resume.company")}</span>
              <input className={styles.replyInput} value={form.companyName} maxLength={160} onChange={(event) => updateForm("companyName", event.target.value)} />
            </label>
            <label className={styles.manualField}>
              <span className={styles.replyLabel}>{t("rest.admin.place")}</span>
              <input className={styles.replyInput} value={form.workplace} maxLength={120} onChange={(event) => updateForm("workplace", event.target.value)} />
            </label>
            <label className={styles.manualField}>
              <span className={styles.replyLabel}>{t("surface.jobs.salary")}</span>
              <input className={styles.replyInput} value={form.salary} placeholder="2.500,00" disabled={form.salaryNegotiable} onChange={(event) => updateForm("salary", event.target.value)} />
            </label>
            <label className={styles.manualCheck}>
              <input type="checkbox" checked={form.salaryNegotiable} onChange={(event) => updateForm("salaryNegotiable", event.target.checked)} />{exactUi("A combinar")}</label>
            <label className={styles.manualField}>
              <span className={styles.replyLabel}>{t("surface.jobs.publishedOn")}</span>
              <input className={styles.replyInput} type="date" value={form.publicationDate} onChange={(event) => updateForm("publicationDate", event.target.value)} />
            </label>
            <label className={`${styles.manualField} ${styles.manualWide}`}>
              <span className={styles.replyLabel}>{t("rest.admin.description")}</span>
              <textarea className={styles.replyTextarea} rows={6} value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
            </label>
            <label className={styles.manualField}>
              <span className={styles.replyLabel}>{t("rest.admin.emailTo")}</span>
              <input className={styles.replyInput} type="email" value={form.applicationEmail} onChange={(event) => updateForm("applicationEmail", event.target.value)} />
            </label>
            <label className={styles.manualField}>
              <span className={styles.replyLabel}>{t("rest.admin.whatsappTo")}</span>
              <input className={styles.replyInput} value={form.applicationWhatsapp} placeholder="(11) 98888-7777" onChange={(event) => updateForm("applicationWhatsapp", event.target.value)} />
            </label>
            <label className={styles.manualField}>
              <span className={styles.replyLabel}>{t("rest.admin.attention")}</span>
              <input className={styles.replyInput} value={form.careOf} maxLength={80} onChange={(event) => updateForm("careOf", event.target.value)} />
            </label>
            <label className={styles.manualField}>
              <span className={styles.replyLabel}>{t("rest.admin.subject")}</span>
              <input className={styles.replyInput} value={form.subject} maxLength={120} onChange={(event) => updateForm("subject", event.target.value)} />
            </label>
            <label className={styles.manualField}>
              <span className={styles.replyLabel}>{t("rest.admin.deadline")}</span>
              <input className={styles.replyInput} type="date" value={form.deadline} onChange={(event) => updateForm("deadline", event.target.value)} />
            </label>
          </div>
          {formError ? <div className={styles.errorBox}>{formError}</div> : null}
          <div className={styles.actions}>
            <button type="button" className={styles.btnGold} disabled={saving} onClick={() => void publishJob()}>
              {saving ? exactUi("Publicando...") : exactUi("Publicar vaga")}
            </button>
          </div>
        </section>
      ) : null}

      {!loading && !error && !openJob ? (
        jobs.length === 0 ? (
          <p className={styles.empty}>{t("rest.admin.noManual")}</p>
        ) : (
          <div className={styles.jobCards}>
            {jobs.map((job) => (
              <article key={job.id} className={styles.jobCard}>
                <button
                  type="button"
                  className={styles.jobCardOpen}
                  onClick={() => {
                    setCreating(false);
                    setOpenId(job.id);
                  }}
                >
                  <span className={styles.jobCardTitle}>{job.title}</span>
                  <span className={styles.jobCardMeta}>{job.companyName}</span>
                  {job.workplace ? <span className={styles.jobCardMeta}>{job.workplace}</span> : null}
                  {job.salaryLabel ? <span className={styles.jobCardMeta}>{job.salaryLabel}</span> : null}
                  <span className={styles.jobCardMeta}>
                    {job.applicationCount} candidatura{job.applicationCount === 1 ? "" : "s"}
                  </span>
                </button>
                <details className={styles.jobCopy}>
                  <summary>{t("rest.admin.shareData")}</summary>
                  <p className={styles.jobDelivery}>{job.deliveryText}</p>
                  <p className={styles.jobCardMeta}>{job.shareUrl}</p>
                  <div className={styles.actions}>
                    <button type="button" className={styles.btnGhost} onClick={() => void copyValue(job.deliveryText, `${job.id}-envio`)}>
                      {copiedId === `${job.id}-envio` ? exactUi("Copiado") : exactUi("Copiar envio")}
                    </button>
                    <button type="button" className={styles.btnGhost} onClick={() => void copyValue(job.shareUrl, `${job.id}-link`)}>
                      {copiedId === `${job.id}-link` ? exactUi("Copiado") : exactUi("Copiar link")}
                    </button>
                    <button type="button" className={styles.btnGhost} onClick={() => void copyValue(job.shareText, `${job.id}-texto`)}>
                      {copiedId === `${job.id}-texto` ? exactUi("Copiado") : exactUi("Copiar texto")}
                    </button>
                  </div>
                </details>
              </article>
            ))}
          </div>
        )
      ) : null}

      {!loading && openJob ? (
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2 className={styles.panelTitle}>{openJob.title}</h2>
              <p className={styles.panelSub}>{vagaResumo(openJob)}</p>
            </div>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => setOpenId(null)}
            >{exactUi("Voltar às vagas")}</button>
          </div>
          <section className={styles.jobSection}>
            <h3 className={styles.replyTitle}>{t("rest.admin.description")}</h3>
            <textarea className={styles.jobCopyText} readOnly value={openJob.description} rows={10} />
            <button type="button" className={styles.btnGhost} onClick={() => void copyValue(openJob.description, "descricao")}>
              {copiedId === "descricao" ? exactUi("Copiado") : exactUi("Copiar descrição")}
            </button>
          </section>

          <section className={styles.jobSection}>
            <h3 className={styles.replyTitle}>{t("rest.admin.how")}</h3>
            <p className={styles.panelSub}>
              {openJob.careOf ? `Aos cuidados de ${openJob.careOf}. ` : null}
              Assunto: {openJob.subject}.
              {openJob.deadline ? ` Prazo: até ${openJob.deadline}.` : null}
            </p>
            <p className={styles.panelSub}>
              {openJob.applicationEmail ? (
                <Link
                  className={styles.linkGold}
                  href={caixaEmailHref(openJob.applicationEmail, {
                    assunto: openJob.subject,
                    cargo: openJob.title,
                    cuidados: openJob.careOf || undefined,
                  })}
                >
                  {openJob.applicationEmail}
                </Link>
              ) : (
                exactUi("Esta vaga não tem e-mail.")
              )}
              {openJob.applicationWhatsapp && openJob.applicationWhatsappHref ? (
                <>
                  {" · "}
                  <a className={styles.linkGold} href={openJob.applicationWhatsappHref} target="_blank" rel="noopener noreferrer">
                    {openJob.applicationWhatsapp}
                  </a>
                </>
              ) : null}
            </p>
            <textarea className={styles.jobCopyText} readOnly value={openJob.deliveryText} rows={5} />
            <button type="button" className={styles.btnGhost} onClick={() => void copyValue(openJob.deliveryText, "envio")}>
              {copiedId === "envio" ? exactUi("Copiado") : exactUi("Copiar forma de envio")}
            </button>
          </section>

          <section className={styles.jobSection}>
            <h3 className={styles.replyTitle}>{t("rest.admin.share")}</h3>
            <p className={styles.panelSub}>
              O link abre a vaga no site. A pessoa clica em Candidatar-se, faz o cadastro e a candidatura aparece aqui, com o PDF.
            </p>
            <textarea className={styles.jobCopyText} readOnly value={openJob.shareUrl} rows={2} />
            <textarea className={styles.jobCopyText} readOnly value={openJob.shareText} rows={8} />
            <div className={styles.actions}>
              <button type="button" className={styles.btnGhost} onClick={() => void copyValue(openJob.shareUrl, "link")}>
                {copiedId === "link" ? exactUi("Copiado") : exactUi("Copiar link")}
              </button>
              <button type="button" className={styles.btnGhost} onClick={() => void copyValue(openJob.shareText, "texto")}>
                {copiedId === "texto" ? exactUi("Copiado") : exactUi("Copiar texto e link")}
              </button>
            </div>
          </section>

          <section className={styles.jobSection}>
            <h3 className={styles.replyTitle}>{t("rest.admin.pdfs")}</h3>
            {openJob.applications.length === 0 ? (
              <p className={styles.empty}>{exactUi("Ainda não há candidaturas nesta vaga.")}</p>
            ) : (
            <ul className={styles.candidateLines}>
              {openJob.applications.map((application) => {
                const pdf = application.resumeLabel === "Currículo em PDF";
                return (
                  <li key={application.id} className={styles.candidateLine}>
                    <div>
                      <span className={styles.candidateName}>{application.name || exactUi("Nome não informado")}</span>
                      <span className={styles.jobCardMeta}>
                        {application.email ? (
                          <Link
                            className={styles.linkGold}
                            href={caixaEmailHref(application.email, {
                              assunto: openJob.subject,
                              nome: application.name || undefined,
                              cargo: openJob.title,
                              vaga: openJob.id,
                              candidatura: application.id,
                              cuidados: openJob.careOf || undefined,
                            })}
                          >
                            {application.email}
                          </Link>
                        ) : (
                          exactUi("Sem e-mail")
                        )}
                        {" · "}
                        {application.whatsapp && application.whatsappHref ? (
                          <a className={styles.linkGold} href={application.whatsappHref} target="_blank" rel="noopener noreferrer">
                            {application.whatsapp}
                          </a>
                        ) : (
                          exactUi("Sem WhatsApp")
                        )}
                      </span>
                    </div>
                    {pdf ? (
                      <a
                        className={styles.linkGold}
                        href={`/api/admin/vagas/${openJob.id}/candidaturas/${application.id}/curriculo`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Baixar PDF
                      </a>
                    ) : (
                      <span>{exactUi("Sem PDF")}</span>
                    )}
                  </li>
                );
              })}
            </ul>
            )}
          </section>
        </section>
      ) : null}
    </main>
  );
}
