/** Remove aspas acidentais coladas em secrets do GitHub Actions. */
export function normalizeE2eSecret(raw: string): string {
  const v = raw.trim();
  if (
    (v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
    (v.startsWith("'") && v.endsWith("'") && v.length >= 2)
  ) {
    return v.slice(1, -1).trim();
  }
  return v;
}

/** Extrai indício de coluna/tabela ausente da URL/erro do NextAuth. */
export function extractSchemaDriftHint(raw: string): string | null {
  if (!raw) return null;
  let text = raw;
  try {
    text = decodeURIComponent(raw);
  } catch {
    /* manter raw */
  }
  const column = text.match(/column [`']?(\w+\.\w+)[`']? does not exist/i);
  if (column?.[1]) return column[1];
  if (/countryCode|does not exist|P2022/i.test(text)) {
    return "coluna internacional ausente (ex.: User.countryCode)";
  }
  return null;
}

/**
 * NextAuth com `json=true` costuma devolver `{ url }` com `error=` na query,
 * sem o campo `error` no JSON. Ex.: `/api/auth/error?error=CredentialsSignin`.
 */
export function extractNextAuthError(body: { url?: string; error?: string }): string | null {
  if (body.error?.trim()) return body.error.trim();
  const raw = body.url || "";
  if (!raw) return null;
  try {
    const q = raw.includes("://")
      ? new URL(raw).searchParams.get("error")
      : new URL(raw, "https://example.invalid").searchParams.get("error");
    return q?.trim() || null;
  } catch {
    const m = raw.match(/[?&]error=([^&]+)/i);
    if (!m?.[1]) return null;
    try {
      return decodeURIComponent(m[1]).trim() || null;
    } catch {
      return m[1].trim() || null;
    }
  }
}

/** Fingerprint seguro do e-mail (não vaza o endereço completo nos logs do CI). */
export function emailFingerprint(email: string): string {
  const normalized = email.toLowerCase().trim();
  const at = normalized.indexOf("@");
  if (at <= 0) return `len=${normalized.length}`;
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  return `localLen=${local.length},domain=${domain}`;
}
