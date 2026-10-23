import Link from "next/link";
import type { Metadata } from "next";
import LogoRecruta from "@/app/components/LogoRecruta";
import { listPublicJobs } from "@/lib/jobs/job-posting-db";
import { jobApplicationDeadline } from "@/lib/jobs/public-job-display";
import styles from "./vagas.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vagas",
  description: "Vagas industriais publicadas no Recruta Indústria.",
};

export default async function VagasPage() {
  let jobs: Awaited<ReturnType<typeof listPublicJobs>> = [];
  let error = "";

  try {
    jobs = await listPublicJobs();
  } catch (loadError) {
    console.error("Erro ao listar vagas públicas:", loadError);
    error = "Não foi possível carregar as vagas agora.";
  }

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Link href="/" className={styles.brandLink} aria-label="Página inicial">
          <LogoRecruta size="sm" as="div" />
        </Link>
      </div>
      <h1 className={styles.heading}>Vagas</h1>
      <p className={styles.lead}>
        Oportunidades publicadas pelo Recruta Indústria. Abra a vaga para ver a descrição e registrar sua candidatura.
      </p>
      {error ? <p className={styles.error}>{error}</p> : null}
      {!error && jobs.length === 0 ? (
        <p className={styles.empty}>Nenhuma vaga aberta no momento.</p>
      ) : null}
      <div className={styles.list}>
        {jobs.map((job) => (
          <Link key={job.id} href={`/vagas/${job.id}`} className={styles.card}>
            <h2 className={styles.cardTitle}>{job.title}</h2>
            <ul className={styles.meta}>
              <li>{job.companyLabel}</li>
              {job.publicationDate ? <li>{job.publicationDate}</li> : null}
              {job.salaryLabel ? <li>{job.salaryLabel}</li> : null}
              {job.contractLabel ? <li>{job.contractLabel}</li> : null}
              {job.workModeLabel ? <li>{job.workModeLabel}</li> : null}
              {job.workplace ? <li>{job.workplace}</li> : null}
              {jobApplicationDeadline(job) ? <li>Inscrições até {jobApplicationDeadline(job)}</li> : null}
            </ul>
          </Link>
        ))}
      </div>
    </main>
  );
}
