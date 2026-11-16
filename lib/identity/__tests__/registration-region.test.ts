import { describe, expect, it } from "vitest";
import {
  BRAZIL_REGISTRATION_REGION,
  REGISTRATION_COUNTRY_UNAVAILABLE,
  existingRegistrationCountryChangeError,
  registrationCountryChoices,
  resolveNewRegistrationCountry,
} from "@/lib/identity/registration-region";

describe("região do cadastro", () => {
  it("mantém Brasil, pt-BR, BRL e America/Sao_Paulo quando o país não vem no pedido", () => {
    expect(resolveNewRegistrationCountry(undefined)).toEqual({
      ok: true,
      region: BRAZIL_REGISTRATION_REGION,
    });
    expect(resolveNewRegistrationCountry("")).toEqual({
      ok: true,
      region: {
        countryCode: "BR",
        locale: "pt-BR",
        currency: "BRL",
        timeZone: "America/Sao_Paulo",
      },
    });
    expect(resolveNewRegistrationCountry("br").ok).toBe(true);
  });

  it("permite escolher outro país sem liberar o cadastro nem inventar região", () => {
    const choices = registrationCountryChoices();
    expect(choices[0]).toMatchObject({ code: "BR", name: "Brasil" });
    expect(choices.find((country) => country.code === "US")?.name).toBe("Estados Unidos");
    expect(new Set(choices.map((country) => country.code)).size).toBe(choices.length);

    const blocked = resolveNewRegistrationCountry("US");
    expect(blocked).toEqual({ ok: false, error: REGISTRATION_COUNTRY_UNAVAILABLE });
    expect(blocked).not.toHaveProperty("region");
    expect(resolveNewRegistrationCountry("BRL")).toEqual({
      ok: false,
      error: "Selecione um país.",
    });
  });

  it("não troca o país de um cadastro já existente", () => {
    expect(existingRegistrationCountryChangeError("BR", undefined)).toBeNull();
    expect(existingRegistrationCountryChangeError("BR", "BR")).toBeNull();
    expect(existingRegistrationCountryChangeError("BR", "US")).toBe(
      "O país deste cadastro não pode ser alterado.",
    );
  });
});
