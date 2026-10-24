import { describe, expect, it } from "vitest";
import { companyCanSearchProfessionals } from "@/lib/company/company-search-access";

const completo = {
  name: "Indústria Teste",
  cnpj: "12.345.678/0001-90",
  responsavelNome: "Ana",
  responsavelCpf: "123.456.789-09",
  telefone: "11999999999",
  endereco: "Rua A, 10",
};

describe("companyCanSearchProfessionals", () => {
  it("libera a conta de teste sem telefone e endereço", () => {
    expect(companyCanSearchProfessionals({
      name: "Paizão",
      cnpj: "12345678000190",
      responsavelNome: "Paulo",
      responsavelCpf: "12345678909",
    }, true)).toBe(true);
    expect(companyCanSearchProfessionals({}, true)).toBe(true);
  });

  it("exige cadastro completo quando não é conta de teste", () => {
    expect(companyCanSearchProfessionals(completo, false)).toBe(true);
    expect(companyCanSearchProfessionals({ ...completo, telefone: "  " }, false)).toBe(false);
    expect(companyCanSearchProfessionals({ ...completo, endereco: "Rua" }, false)).toBe(false);
    expect(companyCanSearchProfessionals({ ...completo, cnpj: "123" }, false)).toBe(false);
  });
});
