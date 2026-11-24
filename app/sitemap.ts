import type { MetadataRoute } from "next";
import { listPublicJobs } from "@/lib/jobs/job-posting-db";

const SITE = "https://www.recrutaindustria.com";

/**
 * Sem prefixo de rota por idioma (cookie ri-locale).
 * Emitir hreflang idêntico para 12 locales engana crawlers — só x-default + pt-BR.
 */
function languageAlternates(path: string): Record<string, string> {
  const url = `${SITE}${path === "/" ? "/" : path}`;
  return {
    "pt-BR": url,
    "x-default": url,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
  }> = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/login", priority: 0.9, changeFrequency: "monthly" },
    { path: "/login?tipo=profissional", priority: 0.8, changeFrequency: "monthly" },
    { path: "/login?tipo=empresa", priority: 0.8, changeFrequency: "monthly" },
    { path: "/professional/register", priority: 0.85, changeFrequency: "monthly" },
    { path: "/company/cadastro", priority: 0.85, changeFrequency: "monthly" },
    { path: "/company/register", priority: 0.7, changeFrequency: "monthly" },
    { path: "/vagas", priority: 0.9, changeFrequency: "daily" },
    { path: "/baixar-app", priority: 0.6, changeFrequency: "monthly" },
    { path: "/termos/uso", priority: 0.4, changeFrequency: "yearly" },
    { path: "/termos/privacidade", priority: 0.4, changeFrequency: "yearly" },
    { path: "/termos/autorizacao-dados", priority: 0.3, changeFrequency: "yearly" },
    { path: "/termos/declaracao-veracidade", priority: 0.3, changeFrequency: "yearly" },
    { path: "/termos/lgpd", priority: 0.3, changeFrequency: "yearly" },
  ];

  const staticEntries: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${SITE}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
    alternates: { languages: languageAlternates(p.path) },
  }));

  let jobEntries: MetadataRoute.Sitemap = [];
  try {
    const jobs = await listPublicJobs();
    // Limita o sitemap a vagas recentes/publicadas (máx. 5k) para não estourar o response.
    jobEntries = jobs.slice(0, 5000).map((job) => {
      const path = `/vagas/${job.id}`;
      const parsed = job.publicationDate ? new Date(job.publicationDate) : null;
      const lastModified =
        parsed && !Number.isNaN(parsed.getTime()) ? parsed : now;
      return {
        url: `${SITE}${path}`,
        lastModified,
        changeFrequency: "daily" as const,
        priority: 0.7,
        alternates: { languages: languageAlternates(path) },
      };
    });
  } catch (error) {
    console.warn("[sitemap] não foi possível listar vagas públicas:", error);
  }

  return [...staticEntries, ...jobEntries];
}
