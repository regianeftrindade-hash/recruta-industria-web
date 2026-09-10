import { describe, expect, it } from "vitest";
import { fallbackTaxIdForSandbox, sanitizeTaxId } from "@/lib/payment/payment-tax";

describe("payment-tax", () => {
  it("sanitiza CPF e CNPJ para só dígitos", () => {
    expect(sanitizeTaxId("123.456.789-09")).toBe("12345678909");
    expect(sanitizeTaxId("12.345.678/0001-90")).toBe("12345678000190");
  });

  it("rejeita documento inválido ou curto", () => {
    expect(sanitizeTaxId(null)).toBeUndefined();
    expect(sanitizeTaxId("123")).toBeUndefined();
    expect(sanitizeTaxId("abc")).toBeUndefined();
  });

  it("fallback de sandbox é CPF de teste conhecido", () => {
    expect(fallbackTaxIdForSandbox()).toBe("11144477735");
  });
});
