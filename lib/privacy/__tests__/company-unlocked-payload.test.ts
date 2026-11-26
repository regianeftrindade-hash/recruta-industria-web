import { describe, expect, it } from "vitest";
import {
  assertUnlockedCompanyPayloadSafe,
  sanitizeUnlockedCompanyPayload,
} from "@/lib/privacy/company-unlocked-payload";

describe("sanitizeUnlockedCompanyPayload", () => {
  it("remove CPF e Art. 11 e preserva contatos autorizados", () => {
    const payload = {
      resumo: {
        id: "prof_test_1",
        nome: "Candidato Teste",
        email: "candidato.teste@example.invalid",
        telefone: "+55 11 90000-0000",
        whatsapp: "+55 11 90000-0000",
        cpf: "123.456.789-00",
        orientacaoSexual: "privada",
      },
      formEdit: {
        cpf: "123.456.789-00",
        email: "candidato.teste@example.invalid",
        formData: {
          cpf: "123.456.789-00",
          telefone: "+55 11 90000-0000",
          whatsapp: "+55 11 90000-0000",
          email: "candidato.teste@example.invalid",
          orientacaoSexual: "privada",
          religiao: "privada",
          antecedentes: "nada",
          identidadeGenero: "privada",
          sexoBiologico: "F",
          cargo: "Soldador",
        },
      },
    };

    const out = sanitizeUnlockedCompanyPayload(payload);
    expect(out.resumo.email).toBe("candidato.teste@example.invalid");
    expect(out.resumo.telefone).toBe("+55 11 90000-0000");
    expect(out.resumo.whatsapp).toBe("+55 11 90000-0000");
    expect(out.resumo.cpf).toBeUndefined();
    expect(out.resumo.orientacaoSexual).toBeUndefined();
    expect(out.formEdit.cpf).toBe("");
    expect(out.formEdit.formData.cpf).toBe("");
    expect(out.formEdit.formData.orientacaoSexual).toBe("");
    expect(out.formEdit.formData.religiao).toBe("");
    expect(out.formEdit.formData.antecedentes).toBe("");
    expect(out.formEdit.formData.identidadeGenero).toBe("");
    expect(out.formEdit.formData.sexoBiologico).toBe("");
    expect(out.formEdit.formData.telefone).toBe("+55 11 90000-0000");
    expect(out.formEdit.formData.cargo).toBe("Soldador");

    expect(assertUnlockedCompanyPayloadSafe(out)).toEqual({ ok: true });
  });

  it("detecta payload inseguro com CPF", () => {
    expect(
      assertUnlockedCompanyPayloadSafe({
        formEdit: { cpf: "123.456.789-00" },
      }),
    ).toEqual({ ok: false, reason: "cpf_digits_present" });
  });
});
