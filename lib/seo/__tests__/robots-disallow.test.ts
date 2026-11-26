import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

describe("robots.txt disallow de superfícies privadas", () => {
  it("bloqueia auth, pagamento e dashboards", () => {
    const conf = robots();
    const rule = Array.isArray(conf.rules) ? conf.rules[0] : conf.rules;
    const disallow = (rule?.disallow || []) as string[];
    for (const path of [
      "/api/",
      "/admin",
      "/login",
      "/esqueci-senha",
      "/reset-password",
      "/pagamento",
      "/professional/dashboard",
      "/professional/pagamento",
      "/professional/checkout",
      "/company/dashboard-empresa",
      "/company/pagamento",
      "/company/professional/",
    ]) {
      expect(disallow, path).toContain(path);
    }
  });

  it("aponta sitemap e host canônicos www", () => {
    const conf = robots();
    expect(conf.sitemap).toBe("https://www.recrutaindustria.com/sitemap.xml");
    expect(conf.host).toBe("https://www.recrutaindustria.com");
  });
});
