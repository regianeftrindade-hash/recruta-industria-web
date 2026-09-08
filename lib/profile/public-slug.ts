/** Slug público legível para URLs de perfil (sem CUID inteiro). */

export function slugifyPart(input: string): string {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Ex.: soldador-sao-paulo-sp-ok51e
 * Usa cargo + local + 6 últimos chars do id (estável e único).
 * Não inclui nome completo (evita vazar identidade em perfis ainda bloqueados).
 */
export function buildProfilePublicSlug(input: {
  id: string;
  title?: string | null;
  cargo?: string | null;
  city?: string | null;
  state?: string | null;
}): string {
  const role = slugifyPart(input.cargo || input.title || "profissional") || "profissional";
  const city = slugifyPart(input.city || "");
  const state = slugifyPart(input.state || "").slice(0, 2);
  const suffix = String(input.id || "perfil")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toLowerCase() || "perfil";

  const parts = [role];
  if (city) parts.push(city);
  if (state) parts.push(state);
  const base = parts.join("-").replace(/-+/g, "-").slice(0, 72);
  return `${base}-${suffix}`;
}

/**
 * Caminho do perfil (empresa).
 * Sempre passe o `profileId` quando tiver — a página abre por ele e não depende do resolve.
 * Ex.: /company/profissional/soldador-sp-ok51e?id=cmr8...
 */
export function companyProfessionalPath(slugOrId: string, profileId?: string | null): string {
  const ref = String(slugOrId || "").trim();
  if (!ref) return "/company/dashboard-empresa";
  const path = `/company/profissional/${encodeURIComponent(ref)}`;
  const id = String(profileId || "").trim();
  if (id && id !== ref) {
    return `${path}?id=${encodeURIComponent(id)}`;
  }
  return path;
}

/** Parece cuid do Prisma (id interno). */
export function looksLikeProfileCuid(value: string): boolean {
  return /^c[a-z0-9]{20,}$/i.test(String(value || "").trim());
}
