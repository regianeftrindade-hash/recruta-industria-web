import { afterEach, describe, expect, it } from "vitest";
import { matchesCompanyTestBypass } from "@/lib/company/company-test-bypass-shared";

describe("bypass empresarial", () => {
  const previous = process.env.COMPANY_TEST_BYPASS_KEYS;

  afterEach(() => {
    if (previous === undefined) delete process.env.COMPANY_TEST_BYPASS_KEYS;
    else process.env.COMPANY_TEST_BYPASS_KEYS = previous;
  });

  it("reconhece só o e-mail exato da conta de teste", () => {
    expect(matchesCompanyTestBypass({ email: "paizaonacozinha@gmail.com" })).toBe(true);
    expect(matchesCompanyTestBypass({ email: "PaizaONaCozinha@gmail.com" })).toBe(true);
  });

  it("aceita o nome da conta de teste e recusa quem só contém a chave", () => {
    expect(matchesCompanyTestBypass({ companyName: "Paizao Na Cozinha LTDA" })).toBe(true);
    expect(matchesCompanyTestBypass({
      email: "outra@empresa.com",
      companyName: "Grupo paizaonacozinha Ltda",
    })).toBe(false);
    expect(matchesCompanyTestBypass({ email: "naopaizaonacozinha@gmail.com" })).toBe(false);
  });

  it("não lê chave publicada no bundle", () => {
    process.env.NEXT_PUBLIC_COMPANY_TEST_BYPASS_KEYS = "contaextra";
    delete process.env.COMPANY_TEST_BYPASS_KEYS;
    expect(matchesCompanyTestBypass({ email: "contaextra@gmail.com" })).toBe(false);
    delete process.env.NEXT_PUBLIC_COMPANY_TEST_BYPASS_KEYS;
  });
});
