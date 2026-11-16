import { sharedOptionMessages } from "@/lib/i18n/messages/shared-options";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import { t } from "@/lib/i18n/translate";

const chavePorValor = new Map<string, MessageKey>();

for (const [chave, valor] of Object.entries(sharedOptionMessages)) {
  chavePorValor.set(valor, chave as MessageKey);
}

/** Texto exibido de uma opção conhecida. Valor desconhecido permanece como foi gravado. */
export function rotuloOpcao(valor: string): string {
  const chave = chavePorValor.get(valor);
  if (!chave) return valor;
  return t(chave);
}
