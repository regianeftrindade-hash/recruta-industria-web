import { describe, expect, it } from "vitest";
import {
  companyDocumentsSubmitted,
  companyVerificationTag,
} from "@/lib/company/company-verification";

describe("companyVerificationTag", () => {
  it("marca empresa verificada quando o admin aprovou", () => {
    expect(companyVerificationTag({
      verificationStatus: "VERIFIED",
      cartaoCnpjUrl: "https://arquivo/cartao.pdf",
      emailCorporativo: "rh@empresa.com.br",
    })).toBe("Empresa verificada");
  });

  it("marca em análise só com cartão e e-mail preenchidos", () => {
    expect(companyVerificationTag({
      verificationStatus: "PENDING",
      cartaoCnpjUrl: "https://arquivo/cartao.pdf",
      emailCorporativo: "rh@empresa.com.br",
    })).toBe("Em análise");
  });

  it("não marca em análise quando cartão ou e-mail estão vazios", () => {
    expect(companyDocumentsSubmitted({
      cartaoCnpjUrl: "",
      emailCorporativo: "rh@empresa.com.br",
    })).toBe(false);
    expect(companyVerificationTag({
      verificationStatus: "PENDING",
      cartaoCnpjUrl: null,
      emailCorporativo: "rh@empresa.com.br",
    })).toBeNull();
    expect(companyVerificationTag({
      verificationStatus: "PENDING",
      cartaoCnpjUrl: "https://arquivo/cartao.pdf",
      emailCorporativo: "  ",
    })).toBeNull();
  });

  it("mostra recusa quando a verificação foi rejeitada", () => {
    expect(companyVerificationTag({
      verificationStatus: "REJECTED",
      cartaoCnpjUrl: null,
      emailCorporativo: null,
    })).toBe("Verificação recusada");
  });
});
