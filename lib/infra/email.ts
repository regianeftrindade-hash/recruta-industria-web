import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

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

function createTransporterFor(cfg: SmtpResolvedConfig): Transporter | null {
  if (!cfg.host || !cfg.user || !cfg.pass) return null;

  const options: SMTPTransport.Options & { family?: 4 | 6 } = {
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    requireTLS: cfg.useStartTls,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
      method: "LOGIN",
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

function isTransientSmtpError(error: unknown): boolean {
  const err = error as { message?: string; code?: string; responseCode?: number };
  const blob = [err.message, err.code, err.responseCode].filter(Boolean).join(" ").toLowerCase();
  return (
    blob.includes("econnection")
    || blob.includes("etimedout")
    || blob.includes("esocket")
    || blob.includes("etls")
    || blob.includes("wrong version number")
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
    return "A Hostinger recusou o login SMTP. SMTP_USER = contato@recrutaindustria.com e SMTP_PASS = senha dessa caixa (símbolo ok, sem aspas na Vercel).";
  }
  if (
    lower.includes("econnection")
    || lower.includes("etimedout")
    || lower.includes("enotfound")
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
    if (isTransientSmtpError(firstError)) {
      const alt = alternatePortConfig(primary);
      const altTransport = createTransporterFor(alt);
      if (altTransport) {
        try {
          console.warn(
            `[email] Tentativa na porta ${primary.port} falhou; retry na ${alt.port}…`,
          );
          await sendWithTransport(altTransport, options, from, alt.user);
          return { ok: true };
        } catch (secondError) {
          console.error("[email] Falha ao enviar (retry):", secondError);
          return { ok: false, error: smtpFailureHint(secondError) };
        }
      }
    }
    console.error("[email] Falha ao enviar:", firstError);
    return { ok: false, error: smtpFailureHint(firstError) };
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
