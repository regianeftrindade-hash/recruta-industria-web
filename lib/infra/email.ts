import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

function unquoteEnv(value: string | undefined): string {
  const raw = (value || "").trim();
  if (
    (raw.startsWith('"') && raw.endsWith('"'))
    || (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

function smtpConfig() {
  const hostRaw = unquoteEnv(process.env.SMTP_HOST);
  const user = unquoteEnv(process.env.SMTP_USER);
  const pass = unquoteEnv(process.env.SMTP_PASS);

  const host = hostRaw
    .replace(/^mail\.hostinger\.com$/i, "smtp.hostinger.com")
    .replace(/^smtp\.hostinger\.com\.br$/i, "smtp.hostinger.com");

  const parsedPort = Number(unquoteEnv(process.env.SMTP_PORT) || "465");
  // Vercel bloqueia a porta 25; Hostinger usa 465 (SSL) ou 587 (STARTTLS).
  const port = parsedPort === 25 || !Number.isFinite(parsedPort) ? 465 : parsedPort;
  const secureFlag = unquoteEnv(process.env.SMTP_SECURE).toLowerCase();
  const secure =
    port === 465
    || secureFlag === "true"
    || secureFlag === "1";
  const useStartTls = port === 587 || (!secure && port !== 465);

  return { host, user, pass, port, secure: port === 465 ? true : !useStartTls && secure, useStartTls };
}

function createTransporter(): Transporter | null {
  const { host, user, pass, port, secure, useStartTls } = smtpConfig();
  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: useStartTls,
    auth: { user, pass },
    // Funções na Vercel costumam sair por IPv6; o SMTP da Hostinger responde melhor em IPv4.
    family: 4,
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
    tls: {
      minVersion: "TLSv1.2",
      servername: host,
    },
  });
}

export function isEmailConfigured(): boolean {
  const { host, user, pass } = smtpConfig();
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

function smtpFromHeader(): string {
  const user = unquoteEnv(process.env.SMTP_USER);
  const configured = unquoteEnv(process.env.SMTP_FROM || process.env.EMAIL_FROM);
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

function smtpFailureHint(error: unknown): string {
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

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const result = await sendEmailDetailed(options);
  return result.ok;
}

export async function sendEmailDetailed(
  options: SendEmailOptions,
): Promise<{ ok: boolean; error?: string }> {
  const transport = createTransporter();
  const from = smtpFromHeader();

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
    const user = unquoteEnv(process.env.SMTP_USER);
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
    return { ok: true };
  } catch (error) {
    console.error("[email] Falha ao enviar:", error);
    return { ok: false, error: smtpFailureHint(error) };
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
