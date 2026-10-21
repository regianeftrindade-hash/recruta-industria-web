import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
import { JobPostingError } from "@/lib/jobs/job-posting";
import { getPublicJob } from "@/lib/jobs/job-posting-db";
import JobApplyButton from "../JobApplyButton";
import styles from "../vagas.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ candidatar?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const job = await getPublicJob(id);
    return { title: job?.title || "Vaga" };
  } catch {
    return { title: "Vaga" };
  }
}

function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className={styles.fact}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default async function VagaPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;

  let job: Awaited<ReturnType<typeof getPublicJob>> = null;
  try {
    job = await getPublicJob(id);
  } catch (error) {
    if (error instanceof JobPostingError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (!job) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Link href="/" className={styles.brandLink} aria-label="Página inicial">
          <LogoRecruta size="sm" as="div" />
        </Link>
        <Link href="/vagas" className={styles.backLink}>
          Todas as vagas
        </Link>
      </div>

      <article className={styles.article}>
        <p className={styles.company}>{job.companyLabel}</p>
        <h1 className={styles.title}>{job.title}</h1>
        <div className={styles.facts}>
          <Fact label="Data da publicação" value={job.publicationDate} />
          <Fact label="Salário" value={job.salaryLabel} />
          <Fact label="Contratação" value={job.contractLabel} />
          <Fact label="Modalidade" value={job.workModeLabel} />
        </div>

        <section className={styles.section}>
          <h2>Descrição da vaga</h2>
          <p className={styles.text}>{job.description}</p>
        </section>

        {job.observations ? (
          <section className={styles.section}>
            <h2>Observações</h2>
            <p className={styles.text}>{job.observations}</p>
          </section>
        ) : null}

        {job.applicationInstructions ? (
          <section className={styles.section}>
            <h2>Como se candidatar</h2>
            <p className={styles.text}>{job.applicationInstructions}</p>
          </section>
        ) : null}

        {job.applicationMode === "EXTERNAL" && job.externalApplyUrl ? (
          <div className={styles.apply}>
            <a
              className={`${styles.externalLink} ri-btn-3d-gold`}
              href={job.externalApplyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Candidatar-se no site da empresa
            </a>
            <p className={styles.note}>
              A inscrição é feita no site da empresa e abre em uma nova aba.
            </p>
          </div>
        ) : (
          <JobApplyButton
            jobId={job.id}
            mode={job.applicationMode === "EMAIL" ? "EMAIL" : "INTERNAL"}
            autoApply={query.candidatar === "1"}
          />
        )}
      </article>
    </main>
  );
}
