import { describe, expect, it } from "vitest";
import {
  ageFromBirthDate,
  isProfessionalAgeAllowed,
  parseBirthDateInput,
  PROFESSIONAL_MIN_AGE_YEARS,
} from "@/lib/privacy/age-gate";

describe("age-gate (cadastro profissional 18+)", () => {
  const now = new Date(2026, 10, 26); // 26/11/2026

  it("exige idade mínima 18", () => {
    expect(PROFESSIONAL_MIN_AGE_YEARS).toBe(18);
  });

  it("aceita maior de 18", () => {
    const r = isProfessionalAgeAllowed("2000-01-15", 18, now);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.age).toBeGreaterThanOrEqual(18);
  });

  it("rejeita menor de 18", () => {
    const r = isProfessionalAgeAllowed("2012-11-26", 18, now);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("underage");
  });

  it("parseia DD/MM/YYYY e ISO", () => {
    expect(parseBirthDateInput("15/03/2000")?.getFullYear()).toBe(2000);
    expect(parseBirthDateInput("2000-03-15")?.getFullYear()).toBe(2000);
  });

  it("calcula idade no aniversário", () => {
    expect(ageFromBirthDate(new Date(2008, 10, 26), now)).toBe(18);
    expect(ageFromBirthDate(new Date(2008, 10, 27), now)).toBe(17);
  });
});
