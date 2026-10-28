import { describe, expect, it } from "vitest";
import {
  isCadastroRapidoPendente,
  isProfessionalRegistrationComplete,
} from "@/lib/professional/professional-registration";

describe("cadastro rápido do profissional", () => {
  it("trata a conta rápida como cadastro ainda incompleto, mesmo com CPF", () => {
    const profile = {
      cpf: "529.982.247-25",
      profileCompletion: 80,
      formDataJSON: JSON.stringify({
        cadastroRapido: true,
        nome: "Ana Silva",
        email: "ana@example.com",
        cpf: "529.982.247-25",
        telefone: "(47) 99999-0000",
      }),
    };

    expect(isCadastroRapidoPendente(profile.formDataJSON)).toBe(true);
    expect(isProfessionalRegistrationComplete(profile)).toBe(false);
  });

  it("considera completo o perfil depois que o cadastro rápido foi substituído", () => {
    const profile = {
      cpf: "529.982.247-25",
      profileCompletion: 40,
      formDataJSON: JSON.stringify({
        nome: "Ana Silva",
        email: "ana@example.com",
        cpf: "52998224725",
      }),
    };

    expect(isCadastroRapidoPendente(profile.formDataJSON)).toBe(false);
    expect(isProfessionalRegistrationComplete(profile)).toBe(true);
  });
});
