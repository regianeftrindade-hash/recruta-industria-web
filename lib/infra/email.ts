import dns from "dns";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

// Vercel/Node às vezes tenta IPv6 primeiro; Hostinger responde melhor em IPv4.
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* ignore em runtimes antigos */
}

export function unquoteEnv(value: string | undefined): string {
  const raw = (value || "").trim().replace(/[\r\n]+/g, "");
  if (
    (raw.startsWith('"') && raw.endsWith('"'))
    || (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

export type SmtpResolvedConfig = {
  host: string;
  user: string;
  pass: string;
  port: number;
  secure: boolean;
  useStartTls: boolean;
};

/** Host plausível (não é nome de variável tipo SMTP_HOST). */
export function isPlausibleSmtpHost(host: string): boolean {
  const h = String(host || "").trim();
  if (!h || !h.includes(".")) return false;
  if (/^(SMTP_|IMAP_|EMAIL_)/i.test(h) && !h.includes(".")) return false;
  if (/^[A-Z][A-Z0-9_]*$/.test(h)) return false;
  return true;
}

/** Resolve host/porta Hostinger (alias mail.* → smtp.*, porta 25 → 465). */
export function resolveSmtpConfig(env: NodeJS.ProcessEnv = process.env): SmtpResolvedConfig {
  const hostRaw = unquoteEnv(env.SMTP_HOST);
  const user = unquoteEnv(env.SMTP_USER);
  const pass = unquoteEnv(env.SMTP_PASS);

  const host = hostRaw
    .replace(/^mail\.hostinger\.com$/i, "smtp.hostinger.com")
    .replace(/^smtp\.hostinger\.com\.br$/i, "smtp.hostinger.com");

  const parsedPort = Number(unquoteEnv(env.SMTP_PORT) || "465");
  const port = parsedPort === 25 || !Number.isFinite(parsedPort) ? 465 : parsedPort;
  const secureFlag = unquoteEnv(env.SMTP_SECURE).toLowerCase();
  const secureRequested =
    port === 465
    || secureFlag === "true"
    || secureFlag === "1";
  const useStartTls = port === 587 || (!secureRequested && port !== 465);

  return {
    host,
    user,
    pass,
    port,
    secure: port === 465 ? true : !useStartTls && secureRequested,
    useStartTls,
  };
}

function createTransporterFor(
  cfg: SmtpResolvedConfig,
  authMethod?: "LOGIN" | "PLAIN",
): Transporter | null {
  if (!cfg.host || !cfg.user || !cfg.pass) return null;
  if (!isPlausibleSmtpHost(cfg.host)) return null;

  const options: SMTPTransport.Options & { family?: 4 | 6 } = {
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    requireTLS: cfg.useStartTls,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
      ...(authMethod ? { method: authMethod } : {}),
    },
    family: 4,
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
    tls: {
      minVersion: "TLSv1.2",
      servername: cfg.host,
    },
  };
  return nodemailer.createTransport(options);
}

function alternatePortConfig(cfg: SmtpResolvedConfig): SmtpResolvedConfig {
  if (cfg.port === 465) {
    return { ...cfg, port: 587, secure: false, useStartTls: true };
  }
  return { ...cfg, port: 465, secure: true, useStartTls: false };
}

function isAuthSmtpError(error: unknown): boolean {
  const err = error as { message?: string; code?: string; response?: string; responseCode?: number };
  const blob = [err.message, err.code, err.response, err.responseCode]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    blob.includes("invalid login")
    || blob.includes("authentication")
    || blob.includes("eauth")
    || blob.includes("535")
    || err.responseCode === 535
  );
}

function isTransientSmtpError(error: unknown): boolean {
  const err = error as { message?: string; code?: string; responseCode?: number; syscall?: string };
  const blob = [err.message, err.code, err.responseCode, err.syscall]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    blob.includes("econnection")
    || blob.includes("etimedout")
    || blob.includes("esocket")
    || blob.includes("etls")
    || blob.includes("wrong version number")
    || blob.includes("eai_again")
    || blob.includes("ebusy")
    || blob.includes("getaddrinfo")
    || blob.includes("421")
    || blob.includes("450")
    || err.responseCode === 421
    || err.responseCode === 450
  );
}

export function isEmailConfigured(): boolean {
  const { host, user, pass } = resolveSmtpConfig();
  return Boolean(host && user && pass);
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
  headers?: Record<string, string>;
}

/** From alinhado ao SMTP_USER (Hostinger rejeita remetente diferente). */
export function resolveSmtpFromHeader(env: NodeJS.ProcessEnv = process.env): string {
  const user = unquoteEnv(env.SMTP_USER);
  const configured = unquoteEnv(env.SMTP_FROM || env.EMAIL_FROM);
  const extracted =
    configured.match(/<([^>]+)>/)?.[1]?.trim() ||
    (configured.includes("@") ? configured : "");
  if (user && extracted && extracted.toLowerCase() !== user.toLowerCase()) {
    return `"Recruta Indústria" <${user}>`;
  }
  if (configured && extracted.toLowerCase() === user.toLowerCase()) {
    return configured;
  }
  return user ? `"Recruta Indústria" <${user}>` : configured;
}

export function smtpFailureHint(error: unknown): string {
  const err = error as {
    message?: string;
    code?: string;
    command?: string;
    response?: string;
    responseCode?: number;
  };
  const blob = [err.message, err.code, err.command, err.response, err.responseCode]
    .filter((part) => part != null && String(part).trim())
    .join(" ");
  const lower = blob.toLowerCase();
  const snippet = String(err.response || err.message || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  if (
    lower.includes("invalid login")
    || lower.includes("authentication")
    || lower.includes("eauth")
    || lower.includes("535")
  ) {
    return "A Hostinger recusou o login SMTP (535). Use a senha da caixa contato@ (não a senha da conta Hostinger). Em E-mails → contato@ → altere/redefina a senha, cole em SMTP_PASS na Vercel sem aspas e faça Redeploy.";
  }
  if (
    lower.includes("getaddrinfo")
    || lower.includes("enotfound")
    || lower.includes("eai_again")
    || lower.includes("ebusy")
  ) {
    return "DNS do SMTP falhou. Em Environment Variables, SMTP_HOST deve ser exatamente smtp.hostinger.com (não o texto SMTP_HOST). Depois faça Redeploy.";
  }
  if (
    lower.includes("econnection")
    || lower.includes("etimedout")
    || lower.includes("esocket")
    || lower.includes("etls")
    || lower.includes("wrong version number")
  ) {
    return "Não conectou no SMTP. Na Vercel use SMTP_HOST=smtp.hostinger.com, SMTP_PORT=465 e SMTP_SECURE=true (alternativa: porta 587 e SMTP_SECURE=false).";
  }
  if (lower.includes("550") || lower.includes("553") || lower.includes("relay") || lower.includes("spf")) {
    return snippet
      ? `A Hostinger bloqueou o destinatário/remetente: ${snippet}`
      : "A Hostinger bloqueou o envio (remetente ou destino). SMTP_FROM deve ser o mesmo que SMTP_USER.";
  }
  if (snippet) {
    return `A Hostinger recusou o envio: ${snippet}`;
  }
  return "O servidor de e-mail recusou o envio. Confira SMTP_HOST=smtp.hostinger.com, SMTP_USER=contato@recrutaindustria.com e a senha da caixa.";
}

async function sendWithTransport(
  transport: Transporter,
  options: SendEmailOptions,
  from: string,
  user: string,
): Promise<void> {
  await transport.sendMail({
    from,
    envelope: user ? { from: user, to: options.to } : undefined,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    ...(options.inReplyTo ? { inReplyTo: options.inReplyTo } : {}),
    ...(options.references ? { references: options.references } : {}),
    ...(options.headers ? { headers: options.headers } : {}),
  });
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const result = await sendEmailDetailed(options);
  return result.ok;
}

export async function sendEmailDetailed(
  options: SendEmailOptions,
): Promise<{ ok: boolean; error?: string }> {
  const primary = resolveSmtpConfig();
  const from = resolveSmtpFromHeader();
  const transport = createTransporterFor(primary);

  if (!transport) {
    const cfg = resolveSmtpConfig();
    if (cfg.host && !isPlausibleSmtpHost(cfg.host)) {
      return {
        ok: false,
        error:
          "SMTP_HOST inválido. O valor deve ser smtp.hostinger.com (não deixe o nome da variável como valor).",
      };
    }
    if (process.env.NODE_ENV === "development") {
      console.info("[email] SMTP não configurado — e-mail não enviado:", {
        to: options.to,
        subject: options.subject,
        replyTo: options.replyTo,
        text: options.text?.slice(0, 200),
      });
    }
    return { ok: false, error: "SMTP não configurado." };
  }

  try {
    await sendWithTransport(transport, options, from, primary.user);
    return { ok: true };
  } catch (firstError) {
    const attempts: Array<{ cfg: SmtpResolvedConfig; method?: "LOGIN" | "PLAIN"; label: string }> = [];
    if (isAuthSmtpError(firstError) || isTransientSmtpError(firstError)) {
      attempts.push(
        { cfg: primary, method: "PLAIN", label: "PLAIN na porta atual" },
        { cfg: primary, method: "LOGIN", label: "LOGIN na porta atual" },
        { cfg: alternatePortConfig(primary), method: undefined, label: "porta alternativa" },
        { cfg: alternatePortConfig(primary), method: "PLAIN", label: "PLAIN na porta alternativa" },
      );
    }

    let lastError: unknown = firstError;
    for (const attempt of attempts) {
      const t = createTransporterFor(attempt.cfg, attempt.method);
      if (!t) continue;
      try {
        console.warn(`[email] Retry: ${attempt.label}…`);
        await sendWithTransport(t, options, from, attempt.cfg.user);
        return { ok: true };
      } catch (err) {
        lastError = err;
      }
    }

    console.error("[email] Falha ao enviar:", lastError);
    return { ok: false, error: smtpFailureHint(lastError) };
  }
}

/** Caixa de contato Recruta Indústria (mensagens de empresas pagas). */
export function getRecrutaSupportEmail(): string {
  return (
    unquoteEnv(process.env.SUPPORT_EMAIL)
    || unquoteEnv(process.env.CONTACT_EMAIL)
    || unquoteEnv(process.env.SMTP_USER)
    || "contato@recrutaindustria.com"
  );
}
