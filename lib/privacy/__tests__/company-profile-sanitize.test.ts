import { describe, expect, it } from "vitest";
import { stripSensitiveCompanyFormEdit } from "@/lib/privacy/company-profile-sanitize";

describe("stripSensitiveCompanyFormEdit", () => {
  it("esvazia campos sensíveis e CPF no formData e no root", () => {
    const formEdit = {
      cpf: "123.456.789-00",
      name: "Ana",
      formData: {
        cpf: "123.456.789-00",
        orientacaoSexual: "privada",
        religiao: "privada",
        antecedentes: "nada",
        identidadeGenero: "privada",
        sexoBiologico: "F",
        cargo: "Soldador",
      },
    };

    const out = stripSensitiveCompanyFormEdit(formEdit);

    expect(out?.cpf).toBe("");
    expect(out?.formData.cpf).toBe("");
    expect(out?.formData.orientacaoSexual).toBe("");
    expect(out?.formData.religiao).toBe("");
    expect(out?.formData.antecedentes).toBe("");
    expect(out?.formData.identidadeGenero).toBe("");
    expect(out?.formData.sexoBiologico).toBe("");
    expect(out?.formData.cargo).toBe("Soldador");
    expect(out?.name).toBe("Ana");
  });

  it("aceita null/undefined sem alterar", () => {
    expect(stripSensitiveCompanyFormEdit(null)).toBeNull();
    expect(stripSensitiveCompanyFormEdit(undefined)).toBeUndefined();
  });
});
