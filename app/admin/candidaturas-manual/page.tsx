"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MANUAL_APPLICATION_EMAIL_SUBJECT } from "@/lib/jobs/manual-application-notice";
import styles from "../admin.module.css";

function caixaEmailHref(email: string, extra?: {
  assunto?: string;
  nome?: string;
  cargo?: string;
  vaga?: string;
  candidatura?: string;
}): string {
  const query = new URLSearchParams();
  query.set("para", email);
  if (extra?.assunto) query.set("assunto", extra.assunto);
  if (extra?.nome) query.set("nome", extra.nome);
  if (extra?.cargo) query.set("cargo", extra.cargo);
  if (extra?.vaga) query.set("vaga", extra.vaga);
  if (extra?.candidatura) query.set("candidatura", extra.candidatura);
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
  applicationCount: number;
  applications: ManualApplication[];
};

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
  const [showApplications, setShowApplications] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/candidaturas-manual", { credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível carregar as vagas.");
      setJobs(Array.isArray(body.jobs) ? body.jobs : []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as vagas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openJob = jobs.find((job) => job.id === openId) ?? null;

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>CANDIDATURAS MANUAL</h1>
          <p className={styles.heroMeta}>
            Abra a vaga para ver o e-mail ou o WhatsApp. Em Candidaturas ficam o nome, o contato e o PDF.
          </p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnGold} onClick={() => void load()}>
            Atualizar
          </button>
        </div>
      </div>

      {loading ? <p className={styles.empty}>Carregando vagas...</p> : null}
      {error ? <div className={styles.errorBox}>{error}</div> : null}

      {!loading && !error && !openJob ? (
        jobs.length === 0 ? (
          <p className={styles.empty}>Nenhuma vaga de envio manual.</p>
        ) : (
          <div className={styles.jobCards}>
            {jobs.map((job) => (
              <button
                key={job.id}
                type="button"
                className={styles.jobCard}
                onClick={() => {
                  setOpenId(job.id);
                  setShowApplications(false);
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
              <p className={styles.panelSub}>
                {openJob.applicationEmail ? (
                  <Link
                    className={styles.linkGold}
                    href={caixaEmailHref(openJob.applicationEmail, {
                      assunto: MANUAL_APPLICATION_EMAIL_SUBJECT,
                      cargo: openJob.title,
                    })}
                  >
                    {openJob.applicationEmail}
                  </Link>
                ) : null}
                {openJob.applicationEmail && openJob.applicationWhatsapp ? " · " : null}
                {openJob.applicationWhatsapp && openJob.applicationWhatsappHref ? (
                  <a className={styles.linkGold} href={openJob.applicationWhatsappHref} target="_blank" rel="noopener noreferrer">
                    {openJob.applicationWhatsapp}
                  </a>
                ) : null}
                {!openJob.applicationEmail && !openJob.applicationWhatsapp ? "Esta vaga não tem e-mail nem WhatsApp." : null}
              </p>
            </div>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => {
                setOpenId(null);
                setShowApplications(false);
              }}
            >
              Voltar às vagas
            </button>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnGold}
              onClick={() => setShowApplications(true)}
            >
              Candidaturas
            </button>
          </div>
          {showApplications && openJob.applications.length === 0 ? (
            <p className={styles.empty}>Ainda não há candidaturas nesta vaga.</p>
          ) : null}
          {showApplications && openJob.applications.length > 0 ? (
            <ul className={styles.candidateLines}>
              {openJob.applications.map((application) => {
                const pdf = application.resumeLabel === "Currículo em PDF";
                return (
                  <li key={application.id} className={styles.candidateLine}>
                    <div>
                      <span className={styles.candidateName}>{application.name || "Nome não informado"}</span>
                      <span className={styles.jobCardMeta}>
                        {application.email ? (
                          <Link
                            className={styles.linkGold}
                            href={caixaEmailHref(application.email, {
                              assunto: MANUAL_APPLICATION_EMAIL_SUBJECT,
                              nome: application.name || undefined,
                              cargo: openJob.title,
                              vaga: openJob.id,
                              candidatura: application.id,
                            })}
                          >
                            {application.email}
                          </Link>
                        ) : (
                          "Sem e-mail"
                        )}
                        {" · "}
                        {application.whatsapp && application.whatsappHref ? (
                          <a className={styles.linkGold} href={application.whatsappHref} target="_blank" rel="noopener noreferrer">
                            {application.whatsapp}
                          </a>
                        ) : (
                          "Sem WhatsApp"
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
                        PDF
                      </a>
                    ) : (
                      <span>Sem PDF</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
