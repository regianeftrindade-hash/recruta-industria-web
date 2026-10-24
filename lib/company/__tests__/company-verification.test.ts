import { describe, expect, it } from "vitest";
import {
  companyDocumentsSubmitted,
  companyVerificationTag,
} from "@/lib/company/company-verification";

describe("companyVerificationTag", () => {
  it("marca a conta como aprovada quando o admin aprovou", () => {
    expect(companyVerificationTag({
      verificationStatus: "VERIFIED",
      cartaoCnpjUrl: "https://arquivo/cartao.pdf",
      emailCorporativo: "rh@empresa.com.br",
    })).toBe("Aprovado");
  });

  it("marca em análise com ou sem cartão e e-mail preenchidos", () => {
    expect(companyVerificationTag({
      verificationStatus: "PENDING",
      cartaoCnpjUrl: "https://arquivo/cartao.pdf",
      emailCorporativo: "rh@empresa.com.br",
    })).toBe("Em análise");
    expect(companyDocumentsSubmitted({
      cartaoCnpjUrl: "",
      emailCorporativo: "rh@empresa.com.br",
    })).toBe(false);
    expect(companyVerificationTag({
      verificationStatus: "PENDING",
      cartaoCnpjUrl: null,
      emailCorporativo: "rh@empresa.com.br",
    })).toBe("Em análise");
    expect(companyVerificationTag({
      verificationStatus: "PENDING",
      cartaoCnpjUrl: "https://arquivo/cartao.pdf",
      emailCorporativo: "  ",
    })).toBe("Em análise");
  });

  it("mostra negado quando a verificação foi recusada", () => {
    expect(companyVerificationTag({
      verificationStatus: "REJECTED",
      cartaoCnpjUrl: null,
      emailCorporativo: null,
    })).toBe("Negado");
  });
});
