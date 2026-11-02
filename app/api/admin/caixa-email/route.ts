import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-auth";
import { fetchInboxMessageByUid, markInboxMessageSeen } from "@/lib/admin/inbox";
import { isEmailConfigured, resolveSmtpFromHeader, sendEmailDetailed } from "@/lib/infra/email";
import { readAdminApplicationResume } from "@/lib/jobs/job-posting-db";
import { JobPostingError } from "@/lib/jobs/job-posting";
import { isDocxBuffer, isPdfBuffer } from "@/lib/jobs/resume-pdf";

const MAX_ANEXO_BYTES = 8 * 1024 * 1024;
const MAX_ANEXOS = 4;

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

function replySubject(original: string): string {
  const trimmed = original.trim() || "(sem assunto)";
  return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

function extensionOf(name: string): string {
  const clean = name.split("?")[0].split("#")[0].split("/").pop() || "";
  const match = /\.([a-z0-9]{1,5})$/i.exec(clean);
  return match?.[1]?.toLowerCase() || "";
}

function safeFileName(name: string, extension: string): string {
  const base = (name.split("?")[0].split("#")[0].split(/[/\\]/).pop() || "anexo")
    .replace(/[^\w.\- ()áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+/g, "_")
    .slice(0, 80);
  return base.toLowerCase().endsWith(`.${extension}`) ? base : `${base}.${extension}`;
}

function isJpeg(buffer: Buffer): boolean {
  return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isPng(buffer: Buffer): boolean {
  return buffer.length > 8 && buffer[0] === 0x89 && buffer.subarray(1, 4).toString("ascii") === "PNG";
}

async function readUploadedFiles(files: File[]): Promise<
  { ok: true; attachments: Array<{ filename: string; content: Buffer; contentType: string }> }
  | { ok: false; error: string }
> {
  if (files.length > MAX_ANEXOS) {
    return { ok: false, error: `Envie no máximo ${MAX_ANEXOS} anexos.` };
  }
  const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
  for (const file of files) {
    if (!file.size) continue;
    if (file.size > MAX_ANEXO_BYTES) {
      return { ok: false, error: "Cada anexo pode ter no máximo 8 MB." };
    }
    const extension = extensionOf(file.name);
    const bytes = Buffer.from(await file.arrayBuffer());
    if (extension === "pdf" && isPdfBuffer(bytes, MAX_ANEXO_BYTES)) {
      attachments.push({ filename: safeFileName(file.name, "pdf"), content: bytes, contentType: "application/pdf" });
      continue;
    }
    if (extension === "docx" && isDocxBuffer(bytes, MAX_ANEXO_BYTES)) {
      attachments.push({
        filename: safeFileName(file.name, "docx"),
        content: bytes,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      continue;
    }
    if ((extension === "jpg" || extension === "jpeg") && isJpeg(bytes)) {
      attachments.push({ filename: safeFileName(file.name, "jpg"), content: bytes, contentType: "image/jpeg" });
      continue;
    }
    if (extension === "png" && isPng(bytes)) {
      attachments.push({ filename: safeFileName(file.name, "png"), content: bytes, contentType: "image/png" });
      continue;
    }
    return { ok: false, error: "Anexo permitido: PDF, DOCX, JPG ou PNG." };
  }
  return { ok: true, attachments };
}

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  jobId: string;
  applicationId: string;
  attachResume: boolean;
  uid?: number;
  files: File[];
};

async function readPayload(request: NextRequest): Promise<MailPayload | NextResponse> {
  const type = request.headers.get("content-type") || "";
  if (type.includes("multipart/form-data")) {
    const form = await request.formData();
    const uid = Number(form.get("uid") || 0);
    const files = form.getAll("arquivos").filter((item): item is File => item instanceof File && item.size > 0);
    return {
      to: String(form.get("to") || ""),
      subject: String(form.get("subject") || ""),
      text: String(form.get("text") || ""),
      jobId: String(form.get("jobId") || ""),
      applicationId: String(form.get("applicationId") || ""),
      attachResume: String(form.get("attachResume") || "") === "1",
      uid: Number.isFinite(uid) && uid > 0 ? uid : undefined,
      files,
    };
  }

  let body: {
    to?: string;
    subject?: string;
    text?: string;
    jobId?: string;
    applicationId?: string;
    attachResume?: boolean;
    uid?: number;
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const uid = Number(body.uid || 0);
  return {
    to: String(body.to || ""),
    subject: String(body.subject || ""),
    text: String(body.text || ""),
    jobId: String(body.jobId || ""),
    applicationId: String(body.applicationId || ""),
    attachResume: body.attachResume === true,
    uid: Number.isFinite(uid) && uid > 0 ? uid : undefined,
    files: [],
  };
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const payload = await readPayload(request);
  if (payload instanceof NextResponse) return payload;

  const to = payload.to.trim().toLowerCase();
  let subject = payload.subject.trim();
  const text = payload.text.trim();
  let inReplyTo: string | undefined;
  let references: string | undefined;
  let quoted = "";
  if (payload.uid) {
    const detail = await fetchInboxMessageByUid(payload.uid, { all: true });
    if (!detail.message) {
      return NextResponse.json({ error: detail.error || "Mensagem não encontrada." }, { status: 404 });
    }
    subject = subject || replySubject(detail.message.subject);
    quoted = detail.message.text.split("\n").map((line) => `> ${line}`).join("\n");
    inReplyTo = detail.message.messageId || undefined;
    references = detail.message.messageId || undefined;
  }
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

  const uploaded = await readUploadedFiles(payload.files);
  if (!uploaded.ok) {
    return NextResponse.json({ error: uploaded.error }, { status: 400 });
  }
  const attachments = [...uploaded.attachments];
  if (payload.attachResume) {
    const jobId = payload.jobId.trim();
    const applicationId = payload.applicationId.trim();
    if (!jobId || !applicationId) {
      return NextResponse.json({ error: "Não há currículo desta candidatura para anexar." }, { status: 400 });
    }
    try {
      const resume = await readAdminApplicationResume(jobId, applicationId);
      if (resume.format !== "pdf") {
        return NextResponse.json({ error: "Esta candidatura não tem currículo em PDF." }, { status: 400 });
      }
      attachments.push({ filename: "curriculo.pdf", content: resume.bytes, contentType: resume.contentType });
    } catch (error) {
      const message = error instanceof JobPostingError ? error.message : "Não foi possível anexar o currículo.";
      const status = error instanceof JobPostingError ? error.status : 400;
      return NextResponse.json({ error: message }, { status });
    }
  }

  const fullText = quoted ? `${text}\n\n---\nEm resposta a:\n${quoted}` : text;
  const html = quoted
    ? `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#222;white-space:pre-wrap">${escapeHtml(text)}</div><hr style="margin:16px 0;border:none;border-top:1px solid #ddd" /><div style="font-size:12px;color:#666;white-space:pre-wrap">${escapeHtml(quoted)}</div>`
    : `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#222;white-space:pre-wrap">${escapeHtml(text)}</div>`;
  const sent = await sendEmailDetailed({
    to,
    subject,
    text: fullText,
    html,
    attachments,
    inReplyTo,
    references,
  });
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error || "Falha ao enviar o e-mail." }, { status: 502 });
  }
  if (payload.uid) await markInboxMessageSeen(payload.uid);

  return NextResponse.json({
    ok: true,
    to,
    subject,
    from: resolveSmtpFromHeader(),
    attached: attachments.length > 0,
  });
}
