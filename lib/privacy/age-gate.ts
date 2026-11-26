/** Idade mínima para cadastro de profissionais (decisão de produto). */
export const PROFESSIONAL_MIN_AGE_YEARS = 18;

/**
 * Calcula idade completa em anos a partir da data de nascimento (calendário local).
 * Retorna null se a data for inválida.
 */
export function ageFromBirthDate(birth: Date, now: Date = new Date()): number | null {
  if (!(birth instanceof Date) || Number.isNaN(birth.getTime())) return null;
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  const dayDiff = now.getDate() - birth.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  if (age < 0 || age > 130) return null;
  return age;
}

/** Aceita Date, ISO `YYYY-MM-DD` ou `DD/MM/YYYY`. */
export function parseBirthDateInput(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    const day = Number(br[1]);
    const month = Number(br[2]);
    const year = Number(br[3]);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
    return d;
  }

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
    return d;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isProfessionalAgeAllowed(
  birthInput: unknown,
  minAge: number = PROFESSIONAL_MIN_AGE_YEARS,
  now: Date = new Date(),
): { ok: true; age: number; birth: Date } | { ok: false; reason: "missing" | "invalid" | "underage" } {
  if (birthInput == null || birthInput === "") return { ok: false, reason: "missing" };
  const birth = parseBirthDateInput(birthInput);
  if (!birth) return { ok: false, reason: "invalid" };
  const age = ageFromBirthDate(birth, now);
  if (age == null) return { ok: false, reason: "invalid" };
  if (age < minAge) return { ok: false, reason: "underage" };
  return { ok: true, age, birth };
}

export function professionalAgeGateErrorMessage(
  reason: "missing" | "invalid" | "underage",
): string {
  if (reason === "missing") {
    return "Informe a data de nascimento. O cadastro profissional é permitido apenas para maiores de 18 anos.";
  }
  if (reason === "invalid") {
    return "Data de nascimento inválida.";
  }
  return "O cadastro profissional é permitido apenas para maiores de 18 anos.";
}
