/** Transforma links, e-mails e telefones visíveis no texto da vaga em endereços clicáveis. */

export type JobTextPart =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string };

const DDD = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

const TOKEN = new RegExp(
  [
    String.raw`https?:\/\/[^\s<>"']+`,
    String.raw`www\.[^\s<>"']+`,
    String.raw`wa\.me\/\d{8,15}`,
    String.raw`[a-z0-9][a-z0-9._%+-]*@[a-z0-9][a-z0-9.-]*\.[a-z]{2,}`,
    String.raw`(?<!\d)(?:\+?55[\s-]*)?\(\d{2}\)[\s-]*(?:9[\s-]?\d{4}|\d{4})[\s-]?\d{4}(?!\d)`,
    String.raw`(?<!\d)\+?55[\s-]*\d{2}[\s-]*(?:9[\s-]?\d{4}|\d{4})[\s-]?\d{4}(?!\d)`,
    String.raw`(?<!\d)\d{2}[\s-]+9[\s-]?\d{4}[\s-]?\d{4}(?!\d)`,
    String.raw`(?<!\d)\d{2}[\s-]+\d{4}-\d{4}(?!\d)`,
    String.raw`(?<!\d)\+?55\d{10,11}(?!\d)`,
    String.raw`(?<!\d)\d{10,11}(?!\d)`,
  ].join("|"),
  "gi",
);

const EMAIL = /^[a-z0-9][a-z0-9._%+-]*@[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i;
const WHATSAPP_CONTEXT = /whats?\s*app|\bwpp\b|\bzap\b/i;

function trimDecorations(raw: string): { value: string; rest: string } {
  let end = raw.length;
  while (end > 0 && ".,;:!?\"'".includes(raw[end - 1])) end -= 1;
  while (end > 0 && ")]}".includes(raw[end - 1])) {
    const closer = raw[end - 1];
    const opener = closer === ")" ? "(" : closer === "]" ? "[" : "{";
    const body = raw.slice(0, end - 1);
    const opens = body.split(opener).length - 1;
    const closes = body.split(closer).length - 1;
    if (opens > closes) break;
    end -= 1;
  }
  return { value: raw.slice(0, end), rest: raw.slice(end) };
}

export function safeHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /javascript:/i.test(trimmed)) return null;
  let href = trimmed;
  if (/^www\./i.test(href) || /^wa\.me\//i.test(href)) href = `https://${href}`;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  return url.href;
}

function nationalPhone(value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return null;
  const ddd = Number(digits.slice(0, 2));
  if (!DDD.has(ddd)) return null;
  if (digits.length === 11 && digits[2] !== "9") return null;
  if (digits.length === 10 && !/^[2-5]/.test(digits.slice(2))) return null;
  return digits;
}

function whatsAppHref(national: string, message?: string): string {
  const base = `https://wa.me/55${national}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

function contextBefore(input: string, start: number): string {
  const lineStart = input.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  return input.slice(Math.max(lineStart, start - 40), start);
}

function phoneHref(display: string, before: string, withMessage: boolean): string | null {
  const national = nationalPhone(display);
  if (!national) return null;
  const mobile = national.length === 11;
  const mentioned = WHATSAPP_CONTEXT.test(before);
  const onlyDigits = /^\d{10,13}$/.test(display.trim());
  const hasCountryOrParen = display.includes("(") || display.includes("+");
  const phoneLabel = /telefone|fone\b|\btel\b|celular/i.test(before);
  if (onlyDigits && !mentioned && !display.trim().startsWith("+")) return null;
  if (!mobile && !hasCountryOrParen && !mentioned && !phoneLabel) return null;
  if (mobile || mentioned) {
    return whatsAppHref(
      national,
      withMessage ? "Olá! Vi a vaga no Recruta Indústria e quero me candidatar." : undefined,
    );
  }
  return `tel:+55${national}`;
}

function hrefForToken(value: string, before: string, withMessage: boolean): string | null {
  if (EMAIL.test(value)) return `mailto:${value}`;
  if (/^https?:\/\//i.test(value) || /^www\./i.test(value) || /^wa\.me\//i.test(value)) {
    return safeHttpUrl(value);
  }
  return phoneHref(value, before, withMessage);
}

export function linkifyJobText(input: string): JobTextPart[] {
  if (!input) return [];
  const parts: JobTextPart[] = [];
  let last = 0;
  for (const match of input.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    const raw = match[0];
    const { value, rest } = trimDecorations(raw);
    if (!value) continue;
    const before = contextBefore(input, start);
    const href = hrefForToken(value, before, false);
    if (!href) continue;
    if (start > last) parts.push({ type: "text", value: input.slice(last, start) });
    parts.push({ type: "link", value, href });
    last = start + value.length;
    if (rest) {
      parts.push({ type: "text", value: rest });
      last = start + raw.length;
    }
  }
  if (last < input.length) parts.push({ type: "text", value: input.slice(last) });
  return parts;
}

export function hrefForShownContact(
  kind: "email" | "whatsapp" | "url",
  value: string,
): string | null {
  const text = value.trim();
  if (!text) return null;
  if (kind === "email") {
    if (!EMAIL.test(text)) return null;
    return `mailto:${text}?subject=${encodeURIComponent("Candidatura via Recruta Indústria")}`;
  }
  if (kind === "url") return safeHttpUrl(text);
  const national = nationalPhone(text);
  if (!national) return null;
  return whatsAppHref(national, "Olá! Vi a vaga no Recruta Indústria e quero me candidatar.");
}
