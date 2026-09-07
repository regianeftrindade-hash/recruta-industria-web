import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import {
  fetchInboxMessageByUid,
  fetchInboxMessages,
  markInboxMessageSeen,
} from '@/lib/admin/inbox';
import { isEmailConfigured, sendEmail } from '@/lib/email';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function replySubject(original: string): string {
  const trimmed = original.trim() || '(sem assunto)';
  return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const uidParam = request.nextUrl.searchParams.get('uid');
  if (uidParam) {
    const uid = Number(uidParam);
    if (!Number.isFinite(uid) || uid < 1) {
      return NextResponse.json({ error: 'UID inválido.' }, { status: 400 });
    }
    const result = await fetchInboxMessageByUid(uid);
    if (result.error && !result.message) {
      const status = result.configured === false ? 503 : result.error.includes('não encontrada') ? 404 : 502;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json(result);
  }

  const limit = Math.min(50, Math.max(5, Number(request.nextUrl.searchParams.get('limit') || 20)));
  const result = await fetchInboxMessages(limit);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: {
    uid?: number;
    action?: string;
    text?: string;
    to?: string;
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const uid = Number(body.uid);
  if (!Number.isFinite(uid) || uid < 1) {
    return NextResponse.json({ error: 'UID inválido.' }, { status: 400 });
  }

  if (body.action === 'markSeen') {
    const result = await markInboxMessageSeen(uid);
    if (!result.ok) {
      const status = result.configured === false ? 503 : 502;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json(result);
  }

  if (body.action === 'reply') {
    const text = String(body.text || '').trim();
    if (text.length < 2) {
      return NextResponse.json({ error: 'Escreva a resposta (mín. 2 caracteres).' }, { status: 400 });
    }
    if (text.length > 8000) {
      return NextResponse.json({ error: 'Resposta muito longa.' }, { status: 400 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json({ error: 'SMTP não configurado no servidor.' }, { status: 503 });
    }

    const detail = await fetchInboxMessageByUid(uid);
    if (!detail.message) {
      return NextResponse.json({ error: detail.error || 'Mensagem não encontrada.' }, { status: 404 });
    }

    const to = String(body.to || detail.message.replyAddress || '').trim().toLowerCase();
    if (!to || !to.includes('@')) {
      return NextResponse.json({
        error: 'Não foi possível identificar o e-mail de destino. Informe o destinatário.',
      }, { status: 400 });
    }

    const subject = replySubject(detail.message.subject);
    const quoted = detail.message.text
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
    const fullText = `${text}\n\n---\nEm resposta a:\n${quoted}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#222;white-space:pre-wrap">${escapeHtml(text)}</div>
      <hr style="margin:16px 0;border:none;border-top:1px solid #ddd" />
      <div style="font-size:12px;color:#666;white-space:pre-wrap">${escapeHtml(quoted)}</div>
    `;

    const sent = await sendEmail({
      to,
      subject,
      text: fullText,
      html,
      inReplyTo: detail.message.messageId || undefined,
      references: detail.message.messageId || undefined,
    });

    if (!sent) {
      return NextResponse.json({ error: 'Falha ao enviar a resposta.' }, { status: 502 });
    }

    await markInboxMessageSeen(uid);

    return NextResponse.json({ ok: true, to, subject });
  }

  return NextResponse.json({ error: 'Ação não suportada.' }, { status: 400 });
}
