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

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const transport = getTransporter();
  const from =
    process.env.SMTP_FROM?.trim()
    || process.env.EMAIL_FROM?.trim()
    || `"Recruta Indústria" <${process.env.SMTP_USER}>`;

  if (!transport) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email] SMTP não configurado — e-mail não enviado:", {
        to: options.to,
        subject: options.subject,
        replyTo: options.replyTo,
        text: options.text?.slice(0, 200),
      });
    }
    return false;
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
    return true;
  } catch (error) {
    console.error("[email] Falha ao enviar:", error);
    return false;
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
