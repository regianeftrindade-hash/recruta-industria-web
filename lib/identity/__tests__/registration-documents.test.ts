import { describe, expect, it } from "vitest";
import { isValidPhoneBR } from "@/lib/security/security";
import { normalizePhoneE164 } from "@/lib/notifications/sanitize";
import {
  checkIdentityDocument,
  formatIdentityDocument,
  isValidPhone,
  registrationDocumentError,
  registrationPhoneError,
} from "@/lib/identity/registration-documents";

const CPF_VALIDO = "529.982.247-25";
const CNPJ_VALIDO = "11.444.777/0001-61";

describe("documentos e telefone por país", () => {
  it("mantém CPF e CNPJ brasileiros", () => {
    expect(checkIdentityDocument(CPF_VALIDO, "CPF")).toMatchObject({ supported: true, countryCode: "BR", valid: true });
    expect(checkIdentityDocument("000.000.000-00", "CPF", "BR")).toMatchObject({ valid: false });
    expect(checkIdentityDocument(CNPJ_VALIDO, "CNPJ", "br")).toMatchObject({ supported: true, valid: true });
    expect(formatIdentityDocument("52998224725", "CPF")).toBe(CPF_VALIDO);
    expect(formatIdentityDocument("11444777000161", "CNPJ")).toBe(CNPJ_VALIDO);
  });

  it("não inventa documento fora do Brasil", () => {
    expect(checkIdentityDocument("ABC123", "PASSAPORTE", "US")).toEqual({
      supported: false,
      countryCode: "US",
      kind: "PASSAPORTE",
    });
    expect(checkIdentityDocument(CPF_VALIDO, "CPF", "PT").supported).toBe(false);
    expect(formatIdentityDocument("ABC123", "PASSAPORTE", "US")).toBe("ABC123");
  });

  it("aceita telefone com DDD e com +55", () => {
    expect(isValidPhoneBR("(11) 98877-6655")).toBe(true);
    expect(isValidPhoneBR("(11) 3333-4444")).toBe(true);
    expect(isValidPhone("11988776655", "BR")).toBe(true);
    expect(normalizePhoneE164("(11) 98877-6655")).toBe("5511988776655");
    expect(normalizePhoneE164("+55 (11) 98877-6655")).toBe("5511988776655");
  });

  it("não trata número estrangeiro como telefone brasileiro", () => {
    expect(isValidPhone("+1 415 555 0123", "US")).toBe(true);
    expect(normalizePhoneE164("+1 415 555 0123", "US")).toBe("14155550123");
    expect(normalizePhoneE164("4155550123", "US")).toBeNull();
    expect(isValidPhone("123", "US")).toBe(false);
  });

  it("recusa CPF e CNPJ fora do Brasil e preserva a mensagem brasileira", () => {
    expect(registrationDocumentError(CPF_VALIDO, "CPF", "BR", "CPF inválido.")).toBeNull();
    expect(registrationDocumentError("123", "CPF", "BR", "CPF inválido.")).toBe("CPF inválido.");
    expect(registrationDocumentError(CPF_VALIDO, "CPF", "US", "CPF inválido.")).toBe(
      "CPF só é aceito em cadastros do Brasil.",
    );
    expect(registrationDocumentError(CNPJ_VALIDO, "CNPJ", "PT", "CNPJ inválido.")).toBe(
      "CNPJ só é aceito em cadastros do Brasil.",
    );
    expect(registrationPhoneError("(11) 98877-6655", "BR", "Informe um telefone válido com DDD.")).toBeNull();
    expect(registrationPhoneError("123", "BR", "Informe um telefone válido com DDD.")).toBe(
      "Informe um telefone válido com DDD.",
    );
    expect(registrationPhoneError("4155550123", "US", "Informe um telefone válido com DDD.")).toBe(
      "Informe o telefone com o código internacional, começando com +.",
    );
  });
});
