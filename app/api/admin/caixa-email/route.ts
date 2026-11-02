import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-auth";
import { isEmailConfigured, resolveSmtpFromHeader, sendEmailDetailed } from "@/lib/infra/email";
import { readAdminApplicationResume } from "@/lib/jobs/job-posting-db";
import { JobPostingError } from "@/lib/jobs/job-posting";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function validEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return NextResponse.json({
    configured: isEmailConfigured(),
    from: resolveSmtpFromHeader(),
  });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: {
    to?: string;
    subject?: string;
    text?: string;
    jobId?: string;
    applicationId?: string;
    attachResume?: boolean;
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const to = String(body.to || "").trim().toLowerCase();
  const subject = String(body.subject || "").trim();
  const text = String(body.text || "").trim();
  if (!validEmail(to)) {
    return NextResponse.json({ error: "Informe um e-mail de destino válido." }, { status: 400 });
  }
  if (subject.length < 2 || subject.length > 180) {
    return NextResponse.json({ error: "Escreva o assunto do e-mail." }, { status: 400 });
  }
  if (text.length < 2 || text.length > 8000) {
    return NextResponse.json({ error: "Escreva a mensagem (mínimo 2 caracteres)." }, { status: 400 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "SMTP não configurado no servidor." }, { status: 503 });
  }

  let attachments: Array<{ filename: string; content: Buffer; contentType: string }> | undefined;
  if (body.attachResume) {
    const jobId = String(body.jobId || "").trim();
    const applicationId = String(body.applicationId || "").trim();
    if (!jobId || !applicationId) {
      return NextResponse.json({ error: "Não há currículo desta candidatura para anexar." }, { status: 400 });
    }
    try {
      const resume = await readAdminApplicationResume(jobId, applicationId);
      if (resume.format !== "pdf") {
        return NextResponse.json({ error: "Esta candidatura não tem currículo em PDF." }, { status: 400 });
      }
      attachments = [{ filename: "curriculo.pdf", content: resume.bytes, contentType: resume.contentType }];
    } catch (error) {
      const message = error instanceof JobPostingError ? error.message : "Não foi possível anexar o currículo.";
      const status = error instanceof JobPostingError ? error.status : 400;
      return NextResponse.json({ error: message }, { status });
    }
  }

  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#222;white-space:pre-wrap">${escapeHtml(text)}</div>`;
  const sent = await sendEmailDetailed({
    to,
    subject,
    text,
    html,
    attachments,
  });
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error || "Falha ao enviar o e-mail." }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    to,
    subject,
    from: resolveSmtpFromHeader(),
    attached: Boolean(attachments?.length),
  });
}
