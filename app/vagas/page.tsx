import Link from "next/link";
import type { Metadata } from "next";
import LogoRecruta from "@/app/components/LogoRecruta";
import { searchPublicJobs } from "@/lib/jobs/job-posting-db";
import { CONTRACT_TYPES, WORK_MODES } from "@/lib/jobs/job-posting";
import { parseJobSearch } from "@/lib/jobs/job-search";
import { paginarLista, paginasDaBarra } from "@/lib/jobs/paginate-list";
import { jobApplicationDeadline } from "@/lib/jobs/public-job-display";
import {
  FAIXAS_SALARIO_VAGA,
  UFS_BRASIL,
  VAGAS_POR_PAGINA_PUBLICA,
  achatarSearchParams,
  aplicarFaixaSalarial,
  hrefListaVagas,
  temFiltroDeVaga,
} from "@/lib/jobs/public-vagas-filtros";
import { caminhoDeVolta, hrefComVolta } from "@/lib/jobs/job-return-path";
import { t } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import styles from "./vagas.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vagas",
  description: "Vagas industriais publicadas no Recruta Indústria.",
};

const CONTRATO: Record<string, MessageKey> = {
  CLT: "surface.jobs.clt",
  PJ: "surface.jobs.pj",
  ESTAGIO: "surface.jobs.intern",
  TEMPORARIO: "surface.jobs.temporary",
  APRENDIZ: "surface.jobs.apprentice",
  FREELANCER: "surface.jobs.freelancer",
  OUTRO: "surface.jobs.other",
};

const MODALIDADE: Record<string, MessageKey> = {
  HOME_OFFICE: "surface.jobs.remote",
  PRESENCIAL: "surface.jobs.onSite",
  HIBRIDO: "surface.jobs.hybrid",
};

const FAIXA: Record<string, MessageKey> = {
  "1000-2000": "surface.jobs.salary1000",
  "2000-3000": "surface.jobs.salary2000",
  "3000-4000": "surface.jobs.salary3000",
  "4000-5000": "surface.jobs.salary4000",
  "acima-5000": "surface.jobs.salaryAbove",
  combinar: "surface.jobs.salaryAgree",
};

function valor(params: Record<string, string | undefined>, key: string): string {
  return params[key] || "";
}

export default async function VagasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = achatarSearchParams(await searchParams);
  const paginaPedida = Math.max(1, Number(params.pagina) || 1);
  let jobs: Awaited<ReturnType<typeof searchPublicJobs>> = [];
  let error = "";

  try {
    jobs = await searchPublicJobs(parseJobSearch(aplicarFaixaSalarial(params)));
  } catch (loadError) {
    console.error("Erro ao listar vagas públicas:", loadError);
    error = t("surface.jobs.loadError");
  }

  const lista = paginarLista(jobs, paginaPedida, VAGAS_POR_PAGINA_PUBLICA);
  const comFiltro = temFiltroDeVaga(params);
  const volta = caminhoDeVolta(params.voltar);

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Link href="/" className={styles.brandLink} aria-label={t("surface.jobs.home")}>
          <LogoRecruta size="sm" as="div" />
        </Link>
      </div>
      <h1 className={styles.heading}>{t("surface.jobs.title")}</h1>
      <p className={styles.lead}>{t("surface.jobs.lead")}</p>

      <form className={styles.filters} method="get" action="/vagas">
        <label className={styles.fieldWide}>
          {t("surface.jobs.keyword")}
          <input className={styles.control} name="q" defaultValue={valor(params, "q")} maxLength={80} placeholder={t("surface.jobs.keyword")} />
        </label>
        <label>
          {t("surface.jobs.state")}
          <select className={styles.control} name="estado" defaultValue={valor(params, "estado")}>
            <option value="">{t("surface.jobs.allStates")}</option>
            {UFS_BRASIL.map((estado) => (
              <option key={estado.uf} value={estado.uf}>{estado.uf} — {estado.nome}</option>
            ))}
          </select>
        </label>
        <label>
          {t("surface.jobs.city")}
          <input className={styles.control} name="cidade" defaultValue={valor(params, "cidade")} maxLength={80} placeholder={t("surface.jobs.city")} />
        </label>
        <label>
          {t("surface.jobs.published")}
          <select className={styles.control} name="periodo" defaultValue={valor(params, "periodo")}>
            <option value="">{t("surface.jobs.anyDate")}</option>
            <option value="24h">{t("surface.jobs.last24")}</option>
            <option value="7">{t("surface.jobs.last7")}</option>
            <option value="15">{t("surface.jobs.last15")}</option>
            <option value="30">{t("surface.jobs.last30")}</option>
          </select>
        </label>
        <label>
          {t("surface.jobs.salary")}
          <select className={styles.control} name="faixa" defaultValue={valor(params, "faixa")}>
            <option value="">{t("surface.jobs.anySalary")}</option>
            {FAIXAS_SALARIO_VAGA.map((faixa) => (
              <option key={faixa.id} value={faixa.id}>{t(FAIXA[faixa.id] || "surface.jobs.anySalary")}</option>
            ))}
          </select>
        </label>
        <label>
          {t("surface.jobs.contract")}
          <select className={styles.control} name="contrato" defaultValue={valor(params, "contrato")}>
            <option value="">{t("surface.jobs.all")}</option>
            {CONTRACT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{t(CONTRATO[option.value])}</option>
            ))}
          </select>
        </label>
        <label>
          {t("surface.jobs.mode")}
          <select className={styles.control} name="modalidade" defaultValue={valor(params, "modalidade")}>
            <option value="">{t("surface.jobs.all")}</option>
            {WORK_MODES.map((option) => (
              <option key={option.value} value={option.value}>{t(MODALIDADE[option.value])}</option>
            ))}
          </select>
        </label>
        {volta ? <input type="hidden" name="voltar" value={volta} /> : null}
        <div className={styles.actions}>
          <button type="submit">{t("surface.jobs.search")}</button>
          {comFiltro ? <Link href={hrefComVolta("/vagas", volta)} className={styles.clearLink}>{t("surface.jobs.clear")}</Link> : null}
        </div>
      </form>

      {error ? <p className={styles.error}>{error}</p> : null}
      {!error && jobs.length === 0 ? (
        <p className={styles.empty}>
          {comFiltro ? t("surface.jobs.noneFiltered") : t("surface.jobs.none")}
        </p>
      ) : null}
      <div className={styles.list}>
        {lista.itens.map((job) => (
          <Link key={job.id} href={hrefComVolta(`/vagas/${job.id}`, volta)} className={styles.card}>
            <h2 className={styles.cardTitle}>{job.title}</h2>
            <ul className={styles.meta}>
              <li>{job.companyLabel}</li>
              {job.publicationDate ? <li>{job.publicationDate}</li> : null}
              {job.salaryLabel ? <li>{job.salaryLabel}</li> : null}
              {job.contractLabel ? <li>{job.contractLabel}</li> : null}
              {job.workModeLabel ? <li>{job.workModeLabel}</li> : null}
              {job.workplace ? <li>{job.workplace}</li> : null}
              {jobApplicationDeadline(job) ? <li>{t("surface.jobs.deadline")} {jobApplicationDeadline(job)}</li> : null}
            </ul>
          </Link>
        ))}
      </div>
      {!error && lista.totalPaginas > 1 ? (
        <nav className={styles.pager} aria-label={t("surface.jobs.pages")}>
          {lista.pagina > 1 ? (
            <Link href={hrefComVolta(hrefListaVagas(params, lista.pagina - 1), volta)}>{t("surface.jobs.prev")}</Link>
          ) : null}
          {paginasDaBarra(lista.pagina, lista.totalPaginas).map((numero) => (
            <Link
              key={numero}
              href={hrefComVolta(hrefListaVagas(params, numero), volta)}
              aria-current={numero === lista.pagina ? "page" : undefined}
            >
              {numero}
            </Link>
          ))}
          {lista.pagina < lista.totalPaginas ? (
            <Link href={hrefComVolta(hrefListaVagas(params, lista.pagina + 1), volta)}>{t("surface.jobs.next")}</Link>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
