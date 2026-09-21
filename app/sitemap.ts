import type { MetadataRoute } from "next";

const SITE = "https://www.recrutaindustria.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }> = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/login", priority: 0.9, changeFrequency: "monthly" },
    { path: "/login?tipo=profissional", priority: 0.8, changeFrequency: "monthly" },
    { path: "/login?tipo=empresa", priority: 0.8, changeFrequency: "monthly" },
    { path: "/professional/register", priority: 0.8, changeFrequency: "monthly" },
    { path: "/company/register", priority: 0.8, changeFrequency: "monthly" },
    { path: "/baixar-app", priority: 0.6, changeFrequency: "monthly" },
    { path: "/termos/autorizacao-dados", priority: 0.3, changeFrequency: "yearly" },
    { path: "/termos/declaracao-veracidade", priority: 0.3, changeFrequency: "yearly" },
    { path: "/termos/lgpd", priority: 0.3, changeFrequency: "yearly" },
  ];

  return pages.map((p) => ({
    url: `${SITE}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
