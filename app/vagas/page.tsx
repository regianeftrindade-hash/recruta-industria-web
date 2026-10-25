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
import styles from "./vagas.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vagas",
  description: "Vagas industriais publicadas no Recruta Indústria.",
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
    error = "Não foi possível carregar as vagas agora.";
  }

  const lista = paginarLista(jobs, paginaPedida, VAGAS_POR_PAGINA_PUBLICA);
  const comFiltro = temFiltroDeVaga(params);
  const volta = caminhoDeVolta(params.voltar);

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Link href="/" className={styles.brandLink} aria-label="Página inicial">
          <LogoRecruta size="sm" as="div" />
        </Link>
      </div>
      <h1 className={styles.heading}>Vagas</h1>
      <p className={styles.lead}>
        Oportunidades publicadas pelo Recruta Indústria. Use a busca para achar cargo, cidade ou salário, e abra a vaga para se candidatar.
      </p>

      <form className={styles.filters} method="get" action="/vagas">
        <label className={styles.fieldWide}>
          Cargo ou palavra-chave
          <input className={styles.control} name="q" defaultValue={valor(params, "q")} maxLength={80} placeholder="Cargo ou palavra-chave" />
        </label>
        <label>
          Estado
          <select className={styles.control} name="estado" defaultValue={valor(params, "estado")}>
            <option value="">Todos</option>
            {UFS_BRASIL.map((estado) => (
              <option key={estado.uf} value={estado.uf}>{estado.uf} — {estado.nome}</option>
            ))}
          </select>
        </label>
        <label>
          Cidade
          <input className={styles.control} name="cidade" defaultValue={valor(params, "cidade")} maxLength={80} placeholder="Cidade" />
        </label>
        <label>
          Publicação
          <select className={styles.control} name="periodo" defaultValue={valor(params, "periodo")}>
            <option value="">Qualquer data</option>
            <option value="24h">Últimas 24 horas</option>
            <option value="7">Últimos 7 dias</option>
            <option value="15">Últimos 15 dias</option>
            <option value="30">Últimos 30 dias</option>
          </select>
        </label>
        <label>
          Salário
          <select className={styles.control} name="faixa" defaultValue={valor(params, "faixa")}>
            <option value="">Qualquer faixa</option>
            {FAIXAS_SALARIO_VAGA.map((faixa) => (
              <option key={faixa.id} value={faixa.id}>{faixa.label}</option>
            ))}
          </select>
        </label>
        <label>
          Contratação
          <select className={styles.control} name="contrato" defaultValue={valor(params, "contrato")}>
            <option value="">Todas</option>
            {CONTRACT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{option.value === "APRENDIZ" ? "Jovem Aprendiz" : option.label}</option>
            ))}
          </select>
        </label>
        <label>
          Modalidade
          <select className={styles.control} name="modalidade" defaultValue={valor(params, "modalidade")}>
            <option value="">Todas</option>
            {WORK_MODES.map((option) => (
              <option key={option.value} value={option.value}>{option.value === "HOME_OFFICE" ? "Home office / remoto" : option.label}</option>
            ))}
          </select>
        </label>
        {volta ? <input type="hidden" name="voltar" value={volta} /> : null}
        <div className={styles.actions}>
          <button type="submit">Buscar</button>
          {comFiltro ? <Link href={hrefComVolta("/vagas", volta)} className={styles.clearLink}>Limpar</Link> : null}
        </div>
      </form>

      {error ? <p className={styles.error}>{error}</p> : null}
      {!error && jobs.length === 0 ? (
        <p className={styles.empty}>
          {comFiltro ? "Nenhuma vaga encontrada com esses filtros." : "Nenhuma vaga aberta no momento."}
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
              {jobApplicationDeadline(job) ? <li>Inscrições até {jobApplicationDeadline(job)}</li> : null}
            </ul>
          </Link>
        ))}
      </div>
      {!error && lista.totalPaginas > 1 ? (
        <nav className={styles.pager} aria-label="Páginas das vagas">
          {lista.pagina > 1 ? (
            <Link href={hrefComVolta(hrefListaVagas(params, lista.pagina - 1), volta)}>Anterior</Link>
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
            <Link href={hrefComVolta(hrefListaVagas(params, lista.pagina + 1), volta)}>Próxima</Link>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
