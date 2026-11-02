"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../admin.module.css";

type ManualRow = {
  id: string;
  jobId: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  resumeLabel: string | null;
};

type ManualPayload = {
  job: { id: string; title: string; companyName: string; workplace: string | null } | null;
  applications: ManualRow[];
};

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export default function CandidaturasManuaisPage() {
  const [data, setData] = useState<ManualPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/candidaturas-manual", { credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível carregar as candidaturas.");
      setData(body as ManualPayload);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as candidaturas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applications = data?.applications ?? [];
  const job = data?.job;

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>CANDIDATURAS MANUAL</h1>
          <p className={styles.heroMeta}>
            {job
              ? `${job.title} · ${job.companyName}${job.workplace ? ` · ${job.workplace}` : ""}`
              : "Vaga de envio manual"}
            . O currículo fica salvo aqui. O encaminhamento para a empresa continua manual, aos cuidados de Maria, assunto Produção, até 05/11/2026.
          </p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnGold} onClick={() => void load()}>
            Atualizar
          </button>
        </div>
      </div>

      <section className={styles.panel}>
        {loading ? <p className={styles.empty}>Carregando candidaturas...</p> : null}
        {error ? <div className={styles.errorBox}>{error}</div> : null}
        {!loading && !error && applications.length === 0 ? (
          <p className={styles.empty}>Ainda não há candidaturas manuais.</p>
        ) : null}
        {!loading && applications.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>Quando</th>
                  <th>Currículo</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => {
                  const pdf = application.resumeLabel === "Currículo em PDF";
                  return (
                    <tr key={application.id}>
                      <td>{application.name || "Nome não informado"}</td>
                      <td>{application.email}</td>
                      <td>{application.phone || "—"}</td>
                      <td>{formatWhen(application.createdAt)}</td>
                      <td>
                        {pdf ? (
                          <a
                            className={styles.linkGold}
                            href={`/api/admin/vagas/${application.jobId}/candidaturas/${application.id}/curriculo`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Baixar PDF
                          </a>
                        ) : (
                          "Sem PDF"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
