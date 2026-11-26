/**
 * Scrubbing de PII / segredos antes de enviar eventos ao Sentry.
 * Não declara conformidade LGPD — só reduz dados sensíveis em telemetria.
 */

const SENSITIVE_KEY =
  /pass(word)?|senha|token|secret|authorization|cookie|cpf|cnpj|rg\b|ssn|card|cvv|pan|pix|boleto|webhook|api[_-]?key|bearer|session|otp|2fa|document|atestado|curriculo|curriculum|whsec/i;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BEARER_RE = /\b(Bearer|Basic)\s+[A-Za-z0-9._\-+=\/]+/gi;
const JWT_RE = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const WHSEC_RE = /\bwhsec_[A-Za-z0-9]+/g;
const SK_RE = /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+/g;

function scrubString(value: string): string {
  return value
    .replace(EMAIL_RE, "[redacted-email]")
    .replace(BEARER_RE, "$1 [redacted]")
    .replace(JWT_RE, "[redacted-jwt]")
    .replace(WHSEC_RE, "[redacted-whsec]")
    .replace(SK_RE, "[redacted-key]");
}

function scrubUnknown(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null) return value;
  if (typeof value === "string") return scrubString(value);
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => scrubUnknown(item, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = scrubUnknown(raw, depth + 1);
  }
  return out;
}

type SentryEventLike = {
  message?: unknown;
  request?: Record<string, unknown>;
  user?: Record<string, unknown>;
  breadcrumbs?: unknown[];
  extra?: unknown;
  contexts?: unknown;
  [key: string]: unknown;
};

/** beforeSend compatível com @sentry/nextjs (evento mutável). */
export function scrubSentryEvent<T extends SentryEventLike>(event: T): T | null {
  try {
    const request = event.request;
    if (request) {
      if (request.cookies) request.cookies = "[redacted]";
      if (request.headers && typeof request.headers === "object") {
        const headers = { ...(request.headers as Record<string, unknown>) };
        for (const key of Object.keys(headers)) {
          if (SENSITIVE_KEY.test(key) || /cookie|authorization/i.test(key)) {
            headers[key] = "[redacted]";
          }
        }
        request.headers = headers;
      }
      if (typeof request.data === "string" || typeof request.data === "object") {
        request.data = scrubUnknown(request.data);
      }
      if (typeof request.query_string === "string") {
        request.query_string = scrubString(request.query_string);
      }
    }

    if (event.user && typeof event.user === "object") {
      const user = { ...event.user };
      if (user.email) user.email = "[redacted-email]";
      if (user.ip_address) user.ip_address = "{{auto}}";
      if (user.username) user.username = "[redacted]";
      event.user = user;
    }

    if (Array.isArray(event.breadcrumbs)) {
      event.breadcrumbs = event.breadcrumbs.map((crumb) => {
        if (!crumb || typeof crumb !== "object") return crumb;
        const c = { ...(crumb as Record<string, unknown>) };
        if (typeof c.message === "string") c.message = scrubString(c.message);
        if (c.data) c.data = scrubUnknown(c.data);
        return c;
      });
    }

    if (event.extra) event.extra = scrubUnknown(event.extra);
    if (event.contexts) event.contexts = scrubUnknown(event.contexts);

    if (typeof event.message === "string") {
      event.message = scrubString(event.message);
    }
  } catch {
    // Nunca bloquear o app por falha de scrubbing.
  }
  return event;
}
