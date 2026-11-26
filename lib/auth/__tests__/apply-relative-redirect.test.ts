import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { applyRelativeRedirect } from "@/lib/auth/apply-relative-redirect";

function loc(res: Response): string {
  return res.headers.get("location") || "";
}

describe("applyRelativeRedirect", () => {
  it("separa path e query de /?acesso=empresa (não gera /%3Facesso)", () => {
    const req = new NextRequest("https://preview.example/company/pagamento?success=1");
    const res = applyRelativeRedirect(req, "/?acesso=empresa", {
      preserveRedirectFrom: "/company/pagamento",
    });
    const href = loc(res);
    expect(href).not.toContain("%3Facesso");
    expect(href).toContain("/?");
    expect(href).toContain("acesso=empresa");
    expect(href).toContain("redirect=%2Fcompany%2Fpagamento");
  });

  it("mantém path puro sem query", () => {
    const req = new NextRequest("https://preview.example/company/pagamento");
    const res = applyRelativeRedirect(req, "/company/dashboard-empresa");
    expect(loc(res)).toMatch(/\/company\/dashboard-empresa$/);
  });

  it("aceita /login?redirect=…", () => {
    const req = new NextRequest("https://preview.example/admin");
    const res = applyRelativeRedirect(req, "/login?redirect=%2Fadmin");
    const href = loc(res);
    expect(href).toContain("/login?");
    expect(href).toContain("redirect=%2Fadmin");
  });
});
