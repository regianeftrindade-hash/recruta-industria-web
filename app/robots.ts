import type { MetadataRoute } from "next";
import { SEO_SITE_ORIGIN } from "@/lib/seo/language-alternates";

const SITE = SEO_SITE_ORIGIN;

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
          "/login",
          "/login/",
          "/esqueci-senha",
          "/esqueci-senha/",
          "/reset-password",
          "/reset-password/",
          "/pagamento",
          "/pagamento/",
          "/professional/dashboard",
          "/professional/dashboard/",
          "/professional/checkout",
          "/professional/checkout/",
          "/professional/pagamento",
          "/professional/pagamento/",
          "/professional/subscription",
          "/professional/subscription/",
          "/professional/upgrade",
          "/professional/upgrade/",
          "/professional/upgrade-success",
          "/professional/success",
          "/company/dashboard-empresa",
          "/company/dashboard-empresa/",
          "/company/pagamento",
          "/company/pagamento/",
          "/company/professional/",
          "/company/success",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
