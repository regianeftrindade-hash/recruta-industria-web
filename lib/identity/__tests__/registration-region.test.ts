import { describe, expect, it } from "vitest";
import {
  BRAZIL_REGISTRATION_REGION,
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

  it("aceita países ISO e grava região internacional", () => {
    const choices = registrationCountryChoices();
    expect(choices[0]?.code).toBe("BR");
    expect(choices.some((country) => country.code === "US")).toBe(true);
    expect(new Set(choices.map((country) => country.code)).size).toBe(choices.length);

    const us = resolveNewRegistrationCountry("US");
    expect(us.ok).toBe(true);
    if (us.ok) {
      expect(us.region.countryCode).toBe("US");
      expect(us.region.locale).toBe("en");
      expect(us.region.currency).toBe("USD");
    }
    const pt = resolveNewRegistrationCountry("PT");
    expect(pt.ok).toBe(true);
    if (pt.ok) {
      expect(pt.region.countryCode).toBe("PT");
      expect(pt.region.locale).toBe("pt-PT");
      expect(pt.region.currency).toBe("EUR");
    }
    const invalid = resolveNewRegistrationCountry("BRL");
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.error.length).toBeGreaterThan(0);
    }
  });

  it("não troca o país de um cadastro já existente", () => {
    expect(existingRegistrationCountryChangeError("BR", undefined)).toBeNull();
    expect(existingRegistrationCountryChangeError("BR", "BR")).toBeNull();
    const locked = existingRegistrationCountryChangeError("BR", "US");
    expect(locked).toBeTruthy();
  });
});
