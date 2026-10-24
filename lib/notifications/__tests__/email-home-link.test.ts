import { describe, expect, it } from "vitest";
import { destinoEmailSemSessao, emailHomeUrl } from "@/lib/notifications/email-home-link";

describe("emailHomeUrl", () => {
  it("aponta o botão do e-mail para a home", () => {
    expect(emailHomeUrl("https://www.recrutaindustria.com")).toBe("https://www.recrutaindustria.com/");
    expect(emailHomeUrl("https://www.recrutaindustria.com/")).toBe("https://www.recrutaindustria.com/");
    expect(emailHomeUrl("https://www.recrutaindustria.com/")).not.toContain("/professional/");
    expect(emailHomeUrl("https://www.recrutaindustria.com/")).not.toContain("/company/");
  });
});

describe("destinoEmailSemSessao", () => {
  it("manda o painel do e-mail para a home quando não há sessão", () => {
    expect(destinoEmailSemSessao("/professional/dashboard")).toBe("/");
    expect(destinoEmailSemSessao("/professional/dashboard/painel")).toBe("/");
    expect(destinoEmailSemSessao("/company/dashboard-empresa")).toBe("/");
  });

  it("deixa login com retorno nas outras páginas protegidas", () => {
    expect(destinoEmailSemSessao("/company/professional/abc")).toBeNull();
    expect(destinoEmailSemSessao("/professional/pagamento")).toBeNull();
  });
});
