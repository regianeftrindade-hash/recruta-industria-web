import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { isCompanyDashboardEmail } from '@/lib/admin/company-dashboard-mail';

export type InboxMessage = {
  id: string;
  uid: number;
  from: string;
  subject: string;
  date: string | null;
  preview: string;
  seen: boolean;
};

export type InboxMessageDetail = InboxMessage & {
  to: string;
  text: string;
  html: string | null;
  /** Destinatário sugerido para resposta (Reply-To ou From). */
  replyAddress: string;
  messageId: string | null;
};

function resolveImapHost(rawHost: string | undefined): string | undefined {
  if (!rawHost) return undefined;
  const host = rawHost.trim().toLowerCase();
  if (!host) return undefined;
  if (host.includes('gmail')) return 'imap.gmail.com';
  if (host.startsWith('smtp.')) return `imap.${host.slice(5)}`;
  return rawHost.trim();
}

function getImapConfig() {
  const user = process.env.IMAP_USER?.trim() || process.env.SMTP_USER?.trim();
  const pass = process.env.IMAP_PASS?.trim() || process.env.SMTP_PASS?.trim();
  const host = process.env.IMAP_HOST?.trim()
    || resolveImapHost(process.env.SMTP_HOST);
  const port = Number(process.env.IMAP_PORT || 993);

  if (!user || !pass || !host) return null;

  return {
    host,
    port,
    secure: process.env.IMAP_SECURE !== 'false',
    auth: { user, pass },
    logger: false as const,
  };
}

export function isInboxConfigured(): boolean {
  return getImapConfig() !== null;
}

function formatAddress(
  list: Array<{ name?: string | null; address?: string | null }> | undefined,
): string {
  if (!list?.length) return '';
  return list
    .map((item) => {
      const address = item.address || '';
      if (item.name) return `${item.name} <${address}>`.trim();
      return address || 'desconhecido';
    })
    .filter(Boolean)
    .join(', ');
}

function flagsSeen(flags: Set<string> | string[] | undefined): boolean {
  if (flags instanceof Set) {
    return flags.has('\\Seen') || flags.has('Seen');
  }
  if (Array.isArray(flags)) {
    return flags.includes('\\Seen') || flags.includes('Seen');
  }
  return false;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** Remove tags perigosas; mantém markup básico para exibição controlada. */
function sanitizeEmailHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '');
}

function addressToText(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return '';
        const entry = item as { name?: string; address?: string };
        if (entry.name && entry.address) return `${entry.name} <${entry.address}>`;
        return entry.address || entry.name || '';
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object') {
    const entry = value as { name?: string; address?: string; text?: string; value?: unknown };
    if (entry.text) return entry.text;
    if (entry.name && entry.address) return `${entry.name} <${entry.address}>`;
    if (entry.address) return entry.address;
    if (entry.value) return addressToText(entry.value);
  }
  return '';
}

function firstEmailAddress(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return match?.[0]?.toLowerCase() || '';
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstEmailAddress(item);
      if (found) return found;
    }
    return '';
  }
  if (typeof value === 'object') {
    const entry = value as { address?: string; value?: unknown; text?: string };
    if (entry.address && entry.address.includes('@')) return entry.address.toLowerCase();
    if (entry.value) return firstEmailAddress(entry.value);
    if (entry.text) return firstEmailAddress(entry.text);
  }
  return '';
}

function extractReplyFromBody(text: string): string {
  const patterns = [
    /E-mail corporativo:\s*([^\s\n]+@[^\s\n]+)/i,
    /E-mail login:\s*([^\s\n]+@[^\s\n]+)/i,
    /Responda este e-mail para falar direto com a empresa \(([^)]+@[^\s)]+)\)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().toLowerCase();
  }
  return '';
}

async function withInboxLock<T>(
  fn: (client: ImapFlow) => Promise<T>,
): Promise<{ ok: true; value: T; mailbox: string } | { ok: false; configured: boolean; mailbox: string | null; error: string }> {
  const config = getImapConfig();
  if (!config) {
    return {
      ok: false,
      configured: false,
      mailbox: null,
      error: 'Configure IMAP_HOST/IMAP_USER/IMAP_PASS (ou SMTP_*) no .env para ler a caixa de e-mail.',
    };
  }

  const client = new ImapFlow(config);
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const value = await fn(client);
      return { ok: true, value, mailbox: config.auth.user };
    } finally {
      lock.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao conectar no IMAP';
    console.error('[inbox]', message);
    return {
      ok: false,
      configured: true,
      mailbox: config.auth.user,
      error: message,
    };
  } finally {
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
  }
}

export async function fetchInboxMessages(limit = 20): Promise<{
  configured: boolean;
  mailbox: string | null;
  messages: InboxMessage[];
  error?: string;
  filter?: string;
}> {
  const result = await withInboxLock(async (client) => {
    const total = typeof client.mailbox === 'object' && client.mailbox ? client.mailbox.exists : 0;
    if (!total) return [] as InboxMessage[];

    // Varre um lote maior e filtra só mensagens do dashboard empresa.
    const scanSize = Math.min(total, Math.max(limit * 15, 100));
    const start = Math.max(1, total - scanSize + 1);
    const messages: InboxMessage[] = [];

    for await (const msg of client.fetch(`${start}:*`, {
      envelope: true,
      source: false,
      flags: true,
      uid: true,
    })) {
      const subject = msg.envelope?.subject || '(sem assunto)';
      if (!isCompanyDashboardEmail({ subject })) continue;

      const fromText = formatAddress(msg.envelope?.from) || 'Remetente desconhecido';
      const date = msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : null;

      messages.push({
        id: String(msg.uid),
        uid: msg.uid,
        from: fromText,
        subject,
        date,
        preview: subject,
        seen: flagsSeen(msg.flags as Set<string> | string[] | undefined),
      });
    }

    messages.sort((a, b) => b.uid - a.uid);
    return messages.slice(0, limit);
  });

  if (!result.ok) {
    return {
      configured: result.configured,
      mailbox: result.mailbox,
      messages: [],
      error: result.error,
      filter: 'company-dashboard',
    };
  }

  return {
    configured: true,
    mailbox: result.mailbox,
    messages: result.value,
    filter: 'company-dashboard',
  };
}

export async function fetchInboxMessageByUid(uid: number): Promise<{
  configured: boolean;
  mailbox: string | null;
  message: InboxMessageDetail | null;
  error?: string;
}> {
  if (!Number.isFinite(uid) || uid < 1) {
    return { configured: true, mailbox: null, message: null, error: 'UID inválido.' };
  }

  const result = await withInboxLock(async (client) => {
    const msg = await client.fetchOne(
      String(uid),
      {
        envelope: true,
        flags: true,
        uid: true,
        source: true,
      },
      { uid: true },
    );

    if (!msg || typeof msg === 'boolean' || !msg.source) {
      return null;
    }

    const source = Buffer.isBuffer(msg.source) ? msg.source : Buffer.from(msg.source);
    const parsed = await simpleParser(source);

    const htmlRaw = typeof parsed.html === 'string' ? parsed.html : null;
    const html = htmlRaw ? sanitizeEmailHtml(htmlRaw).slice(0, 200000) : null;
    let text = (parsed.text || '').trim();
    if (!text && html) {
      text = stripHtml(html);
    }
    if (!text) {
      text = '(sem conteúdo de texto)';
    }
    text = text.slice(0, 50000);

    const subject = parsed.subject
      || msg.envelope?.subject
      || '(sem assunto)';

    const headerMap: Record<string, string | string[] | undefined> = {};
    if (parsed.headers && typeof parsed.headers.get === 'function') {
      headerMap['X-Recruta-Source'] = parsed.headers.get('x-recruta-source') as string | string[] | undefined;
    }

    if (!isCompanyDashboardEmail({ subject, text, headers: headerMap })) {
      return { filtered: true as const };
    }

    const fromText = addressToText(parsed.from)
      || formatAddress(msg.envelope?.from)
      || 'Remetente desconhecido';
    const toText = addressToText(parsed.to)
      || formatAddress(msg.envelope?.to)
      || '';
    const date = parsed.date
      ? parsed.date.toISOString()
      : (msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : null);

    const mailboxUser = (process.env.IMAP_USER || process.env.SMTP_USER || '').trim().toLowerCase();
    let replyAddress =
      firstEmailAddress(parsed.replyTo)
      || firstEmailAddress(parsed.from)
      || firstEmailAddress(fromText);

    // Mensagens internas (empresa → contato@) chegam "de" nós mesmos; usa Reply-To / corpo.
    if (!replyAddress || (mailboxUser && replyAddress === mailboxUser)) {
      replyAddress =
        firstEmailAddress(parsed.replyTo)
        || extractReplyFromBody(text)
        || replyAddress;
    }

    const messageId = typeof parsed.messageId === 'string' ? parsed.messageId : null;

    return {
      filtered: false as const,
      message: {
        id: String(msg.uid),
        uid: msg.uid,
        from: fromText,
        to: toText,
        subject,
        date,
        preview: text.slice(0, 160).replace(/\s+/g, ' ').trim() || subject,
        seen: flagsSeen(msg.flags as Set<string> | string[] | undefined),
        text,
        html,
        replyAddress: replyAddress || '',
        messageId,
      } satisfies InboxMessageDetail,
    };
  });

  if (!result.ok) {
    return {
      configured: result.configured,
      mailbox: result.mailbox,
      message: null,
      error: result.error,
    };
  }

  if (!result.value) {
    return {
      configured: true,
      mailbox: result.mailbox,
      message: null,
      error: 'Mensagem não encontrada.',
    };
  }

  if (result.value.filtered) {
    return {
      configured: true,
      mailbox: result.mailbox,
      message: null,
      error: 'Esta mensagem não veio do dashboard de empresas.',
    };
  }

  return {
    configured: true,
    mailbox: result.mailbox,
    message: result.value.message,
  };
}

export async function markInboxMessageSeen(uid: number): Promise<{
  configured: boolean;
  mailbox: string | null;
  ok: boolean;
  error?: string;
}> {
  if (!Number.isFinite(uid) || uid < 1) {
    return { configured: true, mailbox: null, ok: false, error: 'UID inválido.' };
  }

  const result = await withInboxLock(async (client) => {
    await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
    return true;
  });

  if (!result.ok) {
    return {
      configured: result.configured,
      mailbox: result.mailbox,
      ok: false,
      error: result.error,
    };
  }

  return {
    configured: true,
    mailbox: result.mailbox,
    ok: true,
  };
}
