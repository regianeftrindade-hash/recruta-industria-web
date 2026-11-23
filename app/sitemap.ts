import type { MetadataRoute } from "next";
import { listPublicJobs } from "@/lib/jobs/job-posting-db";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";

const SITE = "https://www.recrutaindustria.com";

/** Preferência de idioma via cookie / Accept-Language (sem prefixo de rota). */
function languageAlternates(path: string): Record<string, string> {
  const url = `${SITE}${path === "/" ? "/" : path}`;
  const languages: Record<string, string> = { "x-default": url };
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = url;
  }
  return languages;
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
