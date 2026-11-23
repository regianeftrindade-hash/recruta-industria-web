import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
import { JobPostingError } from "@/lib/jobs/job-posting";
import { getPublicJobView } from "@/lib/jobs/job-posting-db";
import { jobShareMessage, jobSocialMetadata, publicJobUrl } from "@/lib/jobs/public-job-link";
import { jobApplicationDeadline, textWithoutJobSource } from "@/lib/jobs/public-job-display";
import JobApplyButton from "../JobApplyButton";
import JobBackButton from "../JobBackButton";
import JobFavoriteButton from "@/components/jobs/JobFavoriteButton";
import JobPanelLink from "../JobPanelLink";
import JobShareButton from "../JobShareButton";
import JobText from "../JobText";
import "@/lib/i18n/active-locale.server";
import { bindLocale } from "@/lib/i18n/active-locale";
import { resolveInterfaceLocale } from "@/lib/i18n/resolve-interface-locale";
import { t } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
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
    const absolute = publicJobUrl(view.job.id);
    const jobLocale = (view.job.locale || "pt-BR").replace("-", "_");
    return {
      title: social.title,
      description: social.description,
      alternates: {
        canonical: path,
        languages: {
          "pt-BR": path,
          en: path,
          es: path,
          fr: path,
          de: path,
          it: path,
          "pt-PT": path,
          "zh-CN": path,
          ja: path,
          ko: path,
          ar: path,
          hi: path,
          "x-default": path,
        },
      },
      openGraph: {
        type: "website",
        url: absolute,
        title: social.title,
        description: social.description,
        siteName: "Recruta Indústria",
        locale: jobLocale,
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
  publicationDateIso?: string | null;
  workplace: string | null;
  contractLabel: string | null;
  countryCode?: string;
  currency?: string;
  salaryLabel?: string | null;
  timeZone?: string;
  locale?: string;
}) {
  const country = (job.countryCode || "BR").toUpperCase();
  const currency = (job.currency || "BRL").toUpperCase();
  const datePosted = job.publicationDateIso || undefined;
  const data = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    ...(datePosted ? { datePosted } : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: job.companyLabel,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: country,
        ...(job.workplace ? { addressLocality: job.workplace } : {}),
      },
    },
    ...(job.salaryLabel
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency,
            value: {
              "@type": "QuantitativeValue",
              unitText: "MONTH",
            },
          },
        }
      : {}),
    employmentType: job.contractLabel || undefined,
    url: publicJobUrl(job.id),
    directApply: true,
    inLanguage: job.locale || "pt-BR",
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function VagaPage({ params, searchParams }: Props) {
  const locale = await resolveInterfaceLocale();
  bindLocale(locale);
  const text = (key: MessageKey) => t(key, locale);
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
        <Link href="/" className={styles.brandLink} aria-label={text("surface.jobs.home")}>
          <LogoRecruta size="sm" as="div" />
        </Link>
        <div className={styles.topActions}>
          <JobBackButton />
          <JobPanelLink />
          <Link href="/vagas" className={styles.backLink}>
            {text("surface.jobs.allJobs")}
          </Link>
        </div>
      </div>

      {view.availability === "unavailable" ? (
        <article className={styles.article}>
          <h1 className={styles.title}>{view.title}</h1>
          <p className={styles.error}>{text("surface.jobs.unavailable")}</p>
        </article>
      ) : (
        <article className={styles.article}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jobPostingJsonLd(view.job) }}
          />
          <p className={styles.company}>{view.job.companyLabel}</p>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{view.job.title}</h1>
            <div className={styles.titleTools}>
              <JobFavoriteButton jobId={view.job.id} retorno={`/vagas/${view.job.id}`} carregar />
              <JobShareButton jobId={view.job.id} shareText={jobShareMessage(view.job)} />
            </div>
          </div>
          <div className={styles.facts}>
            <Fact label={text("surface.jobs.publishedOn")} value={view.job.publicationDate} />
            <Fact label={text("surface.jobs.salary")} value={view.job.salaryLabel} />
            <Fact label={text("surface.jobs.currency")} value={view.job.currency} />
            <Fact label={text("surface.jobs.country")} value={view.job.countryCode} />
            <Fact label={text("surface.jobs.contract")} value={view.job.contractLabel} />
            <Fact label={text("surface.jobs.mode")} value={view.job.workModeLabel} />
            <Fact label={text("surface.jobs.workplace")} value={view.job.workplace} />
            <Fact
              label={text("surface.jobs.applyUntil")}
              value={jobApplicationDeadline(view.job) ? `${text("surface.jobs.until")} ${jobApplicationDeadline(view.job)}` : null}
            />
          </div>

          <section className={styles.section}>
            <h2>{text("surface.jobs.descriptionHeading")}</h2>
            <JobText text={view.job.description} />
          </section>

          {textWithoutJobSource(view.job.observations) ? (
            <section className={styles.section}>
              <h2>{text("surface.jobs.notes")}</h2>
              <JobText text={textWithoutJobSource(view.job.observations) ?? ""} />
            </section>
          ) : null}

          <JobApplyButton
            jobId={view.job.id}
            mode={view.job.applicationMode}
            externalApplyUrl={view.job.applicationMode === "EXTERNAL" ? view.job.externalApplyUrl : null}
            autoOpen={query.candidatar === "1"}
            howToApply={view.job.applicationInstructions}
          />
        </article>
      )}
    </main>
  );
}
