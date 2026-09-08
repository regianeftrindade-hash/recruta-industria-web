/** Slug público legível (opcional). Abertura do perfil usa sempre o id interno. */

export function slugifyPart(input: string): string {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

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
 * URL de abertura do perfil — SEMPRE pelo id (confiável).
 * O slug amigável fica para depois; não bloqueia mais a navegação.
 */
export function companyProfessionalPath(_slugOrId: string, profileId?: string | null): string {
  const id = String(profileId || _slugOrId || "").trim();
  if (!id) return "/company/dashboard-empresa";
  return `/company/professional/${encodeURIComponent(id)}`;
}

export function looksLikeProfileCuid(value: string): boolean {
  return /^c[a-z0-9]{20,}$/i.test(String(value || "").trim());
}
