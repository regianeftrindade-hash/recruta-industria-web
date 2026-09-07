/** Formatação de valores em reais (R$) para inputs e exibição. */

export function digitsOnlyMoney(value: string): string {
  return String(value || "").replace(/\D/g, "");
}

/** Converte digitação em "R$ 4.200" (ou com centavos se houver). */
export function maskReaisInput(raw: string): string {
  const digits = digitsOnlyMoney(raw);
  if (!digits) return "";

  // Se o usuário digitar muitos dígitos, trata os 2 últimos como centavos
  if (digits.length <= 2) {
    const n = Number(digits);
    return `R$ ${n.toLocaleString("pt-BR")}`;
  }

  // Preferência: valores inteiros (salário) quando digitação curta típica
  // Usa centavos só se houver vírgula no raw OU mais de 6 dígitos com padrão de cents
  const hasComma = String(raw).includes(",");
  if (hasComma) {
    const cents = digits.slice(-2);
    const ints = digits.slice(0, -2) || "0";
    const intNum = Number(ints);
    return `R$ ${intNum.toLocaleString("pt-BR")},${cents}`;
  }

  const intNum = Number(digits);
  return `R$ ${intNum.toLocaleString("pt-BR")}`;
}

/** Garante prefixo R$ na exibição (não altera se já tiver). */
export function formatReaisDisplay(value: string | null | undefined): string {
  const s = String(value || "").trim();
  if (!s || s === "—") return s;
  if (/^r\$\s*/i.test(s)) {
    const rest = s.replace(/^r\$\s*/i, "").trim();
    if (!rest) return "R$";
    return `R$ ${rest}`;
  }
  const digits = digitsOnlyMoney(s);
  if (digits && /^\d[\d.,\s]*$/.test(s.replace(/^r\$\s*/i, ""))) {
    return maskReaisInput(s);
  }
  return `R$ ${s}`;
}

/** Turnos das propostas / entrevistas (lista suspensa). */
export const TURNOS_PROPOSTA = [
  { value: "1º Turno", label: "Primeiro turno" },
  { value: "2º Turno", label: "Segundo turno" },
  { value: "3º Turno", label: "Terceiro turno" },
  { value: "Integral", label: "Integral" },
] as const;

export function turnoPropostaLabel(value: string | null | undefined): string {
  const v = String(value || "").trim();
  if (!v) return "—";
  const lower = v.toLowerCase();
  const found = TURNOS_PROPOSTA.find(
    (t) =>
      t.value === v ||
      t.label.toLowerCase() === lower ||
      t.label.toLowerCase().startsWith(lower) ||
      ["primeiro", "segundo", "terceiro"].some(
        (k) => lower === k && t.label.toLowerCase().startsWith(k),
      ),
  );
  return found ? found.label : v;
}
