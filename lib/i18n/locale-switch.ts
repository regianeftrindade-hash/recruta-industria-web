export type LocaleSwitchResult =
  | { ok: true }
  | { ok: false; reason: "network" | "invalid" | "rejected" };

/** Envia o idioma. 400 é código recusado. Outra falha HTTP não vira "idioma não suportado". */
type LocaleFetcher = (input: string, init?: RequestInit) => Promise<{ ok: boolean; status?: number }>;

export async function requestLocaleChange(
  locale: string,
  fetcher: LocaleFetcher = fetch,
): Promise<LocaleSwitchResult> {
  const query = encodeURIComponent(locale);
  try {
    const response = await fetcher(`/api/account/locale?locale=${query}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    if (response.ok) return { ok: true };
    if (response.status === 400) return { ok: false, reason: "invalid" };
    return { ok: false, reason: "rejected" };
  } catch {
    return { ok: false, reason: "network" };
  }
}
