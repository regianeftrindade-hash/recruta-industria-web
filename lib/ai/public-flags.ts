/**
 * Flags seguras para o client (apenas NEXT_PUBLIC_*).
 * Nunca importe @/lib/openai em componentes client.
 */

export function isAiUiEnabled(): boolean {
  const v = String(process.env.NEXT_PUBLIC_ENABLE_AI || "")
    .trim()
    .toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}
