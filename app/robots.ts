import type { MetadataRoute } from "next";

const SITE = "https://www.recrutaindustria.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/admin-verify-2fa",
          "/professional/dashboard",
          "/professional/dashboard/",
          "/company/dashboard-empresa",
          "/company/dashboard-empresa/",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
