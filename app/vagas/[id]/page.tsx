import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
import { JobPostingError } from "@/lib/jobs/job-posting";
import { getPublicJobView } from "@/lib/jobs/job-posting-db";
import { jobSocialMetadata, publicJobUrl } from "@/lib/jobs/public-job-link";
import JobApplyButton from "../JobApplyButton";
import JobBackButton from "../JobBackButton";
import styles from "../vagas.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ candidatar?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const view = await getPublicJobView(id);
    if (!view) return { title: "Vaga", robots: { index: false, follow: false } };
    if (view.availability === "unavailable") {
      return {
        title: view.title,
        description: "Esta vaga não está mais disponível para candidatura.",
        robots: { index: false, follow: false },
      };
    }
    const social = jobSocialMetadata(view.job);
    const path = `/vagas/${view.job.id}`;
    return {
      title: social.title,
      description: social.description,
      alternates: { canonical: path },
      openGraph: {
        type: "website",
        url: path,
        title: social.title,
        description: social.description,
        siteName: "Recruta Indústria",
        locale: "pt_BR",
      },
      twitter: {
        card: "summary_large_image",
        title: social.title,
        description: social.description,
      },
      robots: { index: true, follow: true },
    };
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

function jobPostingJsonLd(job: {
  id: string;
  title: string;
  description: string;
  companyLabel: string;
  publicationDate: string | null;
  workplace: string | null;
  contractLabel: string | null;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.publicationDate,
    hiringOrganization: {
      "@type": "Organization",
      name: job.companyLabel,
    },
    jobLocation: job.workplace
      ? { "@type": "Place", address: job.workplace }
      : undefined,
    employmentType: job.contractLabel,
    url: publicJobUrl(job.id),
    directApply: true,
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function VagaPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;

  let view: Awaited<ReturnType<typeof getPublicJobView>> = null;
  try {
    view = await getPublicJobView(id);
  } catch (error) {
    if (error instanceof JobPostingError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (!view) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Link href="/" className={styles.brandLink} aria-label="Página inicial">
          <LogoRecruta size="sm" as="div" />
        </Link>
        <div className={styles.topActions}>
          <JobBackButton />
          <Link href="/vagas" className={styles.backLink}>
            Todas as vagas
          </Link>
        </div>
      </div>

      {view.availability === "unavailable" ? (
        <article className={styles.article}>
          <h1 className={styles.title}>{view.title}</h1>
          <p className={styles.error}>Esta vaga não está mais disponível para candidatura.</p>
        </article>
      ) : (
        <article className={styles.article}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jobPostingJsonLd(view.job) }}
          />
          <p className={styles.company}>{view.job.companyLabel}</p>
          <h1 className={styles.title}>{view.job.title}</h1>
          <div className={styles.facts}>
            <Fact label="Data da publicação" value={view.job.publicationDate} />
            <Fact label="Salário" value={view.job.salaryLabel} />
            <Fact label="Contratação" value={view.job.contractLabel} />
            <Fact label="Modalidade" value={view.job.workModeLabel} />
            <Fact label="Local de trabalho" value={view.job.workplace} />
          </div>

          <section className={styles.section}>
            <h2>Descrição da vaga</h2>
            <p className={styles.text}>{view.job.description}</p>
          </section>

          {view.job.observations ? (
            <section className={styles.section}>
              <h2>Observações</h2>
              <p className={styles.text}>{view.job.observations}</p>
            </section>
          ) : null}

          {view.job.applicationInstructions ? (
            <section className={styles.section}>
              <h2>Como se candidatar</h2>
              <p className={styles.text}>{view.job.applicationInstructions}</p>
            </section>
          ) : null}

          {view.job.applicationMode === "EXTERNAL" && view.job.externalApplyUrl ? (
            <div className={styles.apply}>
              <a
                className={`${styles.externalLink} ri-btn-3d-gold`}
                href={view.job.externalApplyUrl}
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
              jobId={view.job.id}
              mode={view.job.applicationMode === "EMAIL" ? "EMAIL" : "INTERNAL"}
              autoApply={view.job.applicationMode !== "EMAIL" && query.candidatar === "1"}
            />
          )}
        </article>
      )}
    </main>
  );
}
