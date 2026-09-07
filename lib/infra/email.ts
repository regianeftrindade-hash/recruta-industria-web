import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    return null;
  }

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    // Hostinger SSL/TLS: porta 465 com secure=true
    const secure =
      process.env.SMTP_SECURE === "true"
      || process.env.SMTP_SECURE === "1"
      || port === 465;

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        minVersion: "TLSv1.2",
      },
    });
  }

  return transporter;
}

export function isEmailConfigured(): boolean {
  return getTransporter() !== null;
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
  const user = (process.env.SMTP_USER || "").trim();
  const configured = (process.env.SMTP_FROM || process.env.EMAIL_FROM || "").trim();
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
  const raw = error instanceof Error ? `${error.message} ${error}` : String(error);
  const lower = raw.toLowerCase();
  if (
    lower.includes("invalid login")
    || lower.includes("authentication")
    || lower.includes("eauth")
    || lower.includes("535")
  ) {
    return "A Hostinger recusou o login SMTP. SMTP_USER tem que ser a caixa completa e SMTP_PASS a senha dessa caixa (não a do Gmail e sem aspas na Vercel).";
  }
  if (lower.includes("econnection") || lower.includes("etimedout") || lower.includes("enotfound")) {
    return "Não conectou no SMTP_HOST. Use smtp.hostinger.com e porta 465 (SMTP_SECURE=true).";
  }
  return "O servidor de e-mail recusou o envio. Confira SMTP_HOST, SMTP_USER e SMTP_PASS na Vercel.";
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const result = await sendEmailDetailed(options);
  return result.ok;
}

export async function sendEmailDetailed(
  options: SendEmailOptions,
): Promise<{ ok: boolean; error?: string }> {
  const transport = getTransporter();
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
    await transport.sendMail({
      from,
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
    process.env.SUPPORT_EMAIL?.trim()
    || process.env.CONTACT_EMAIL?.trim()
    || process.env.SMTP_USER?.trim()
    || "contato@recrutaindustria.com"
  );
}
