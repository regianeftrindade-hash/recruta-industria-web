export type LocaleSwitchResult =
  | { ok: true }
  | { ok: false; reason: "network" | "rejected" };

/** Envia o idioma. Falha de rede ou resposta ruim não são tratadas como sucesso. */
type LocaleFetcher = (input: string, init?: RequestInit) => Promise<{ ok: boolean }>;

export async function requestLocaleChange(
  locale: string,
  fetcher: LocaleFetcher = fetch,
): Promise<LocaleSwitchResult> {
  try {
    const response = await fetcher("/api/account/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    if (!response.ok) return { ok: false, reason: "rejected" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "network" };
  }
}
