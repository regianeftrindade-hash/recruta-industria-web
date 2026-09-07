'use client';

import React, { useCallback, useEffect, useState } from 'react';
import styles from '../admin.module.css';

type InboxMessage = {
  id: string;
  uid?: number;
  from: string;
  subject: string;
  date: string | null;
  seen: boolean;
};

type InboxMessageDetail = InboxMessage & {
  to?: string;
  text: string;
  replyAddress?: string;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function AdminContatoPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [mailbox, setMailbox] = useState<string | null>(null);
  const [inboxError, setInboxError] = useState('');
  const [inboxConfigured, setInboxConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessageDetail | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyStatus, setReplyStatus] = useState('');

  const loadInbox = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inbox?limit=30', { credentials: 'include' });
      const inbox = await res.json();
      setInboxConfigured(inbox.configured === true);
      setMailbox(inbox.mailbox || null);
      setMessages(inbox.messages || []);
      setInboxError(inbox.error || '');
    } catch {
      setInboxError('Erro ao carregar a caixa de e-mail.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  const openMessage = async (uid: number) => {
    setSelectedUid(uid);
    setMessageLoading(true);
    setMessageError('');
    setSelectedMessage(null);
    setReplyText('');
    setReplyStatus('');
    try {
      const res = await fetch(`/api/admin/inbox?uid=${uid}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.message) {
        setMessageError(data.error || 'Não foi possível abrir a mensagem.');
        return;
      }
      const message = data.message as InboxMessageDetail;
      setSelectedMessage(message);
      setReplyTo(message.replyAddress || '');

      const markRes = await fetch('/api/admin/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ uid, action: 'markSeen' }),
      });
      if (markRes.ok) {
        setMessages((prev) =>
          prev.map((msg) => (Number(msg.uid ?? msg.id) === uid ? { ...msg, seen: true } : msg)),
        );
      }
    } catch {
      setMessageError('Erro ao carregar a mensagem.');
    } finally {
      setMessageLoading(false);
    }
  };

  const sendReply = async () => {
    if (!selectedUid) return;
    const text = replyText.trim();
    if (text.length < 2) {
      setReplyStatus('Escreva a resposta antes de enviar.');
      return;
    }
    setReplyBusy(true);
    setReplyStatus('');
    try {
      const res = await fetch('/api/admin/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          uid: selectedUid,
          action: 'reply',
          text,
          to: replyTo.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReplyStatus(data.error || 'Falha ao enviar a resposta.');
        return;
      }
      setReplyStatus(`Resposta enviada para ${data.to || replyTo}.`);
      setReplyText('');
    } catch {
      setReplyStatus('Erro de rede ao enviar a resposta.');
    } finally {
      setReplyBusy(false);
    }
  };

  const unread = messages.filter((m) => !m.seen).length;

  return (
    <div className={styles.main}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>
            Caixa de <span>contato</span>
          </h1>
          <p className={styles.heroMeta}>
            Somente e-mails enviados pela caixa de contato do dashboard das empresas.
            {unread > 0 ? ` · ${unread} não lida${unread === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <div className={styles.actions}>
          <a
            href="https://mail.hostinger.com"
            target="_blank"
            rel="noreferrer"
            className={styles.btnGhost}
          >
            Abrir webmail
          </a>
          <button type="button" className={styles.btnGold} onClick={() => void loadInbox()}>
            Atualizar
          </button>
        </div>
      </div>

      {loading && <p className={styles.empty}>Carregando caixa de e-mail…</p>}

      {inboxError && (
        <div className={styles.warnBox}>
          {inboxError}
          {!inboxConfigured && (
            <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', color: '#C89B3C', fontSize: 12 }}>
{`IMAP_HOST=imap.hostinger.com
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=contato@recrutaindustria.com
IMAP_PASS=sua-senha`}
            </pre>
          )}
        </div>
      )}

      {!loading && !inboxError && (
        <div className={styles.contatoGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <h2 className={styles.panelTitle}>Entrada</h2>
                <p className={styles.panelSub}>
                  {messages.length} mensagem{messages.length === 1 ? '' : 's'} recente{messages.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {messages.length === 0 ? (
              <p className={styles.empty}>Nenhuma mensagem do dashboard empresa.</p>
            ) : (
              <div className={`${styles.mailList} ${styles.mailListTall}`}>
                {messages.map((msg) => {
                  const uid = Number(msg.uid ?? msg.id);
                  const active = selectedUid === uid;
                  return (
                    <button
                      key={msg.id}
                      type="button"
                      className={`${styles.mailItem} ${msg.seen ? '' : styles.mailItemUnread} ${active ? styles.mailItemActive : ''}`}
                      onClick={() => void openMessage(uid)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div className={styles.mailSubject}>{msg.subject}</div>
                        <div className={styles.mailDate}>{formatDate(msg.date)}</div>
                      </div>
                      <div className={styles.mailFrom}>{msg.from}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <h2 className={styles.panelTitle}>Mensagem</h2>
                <p className={styles.panelSub}>
                  {selectedMessage ? 'Leitura e resposta' : 'Selecione um e-mail à esquerda'}
                </p>
              </div>
            </div>

            {messageLoading && <p className={styles.mailDetailLoading}>Abrindo mensagem…</p>}
            {messageError && <p className={styles.mailDetailError}>{messageError}</p>}

            {!messageLoading && !selectedMessage && !messageError && (
              <p className={styles.empty}>Nenhuma mensagem selecionada.</p>
            )}

            {selectedMessage && !messageLoading && (
              <>
                <div className={styles.mailDetail}>
                  <div className={styles.mailDetailHead}>
                    <div>
                      <div className={styles.mailSubject}>{selectedMessage.subject}</div>
                      <p className={styles.mailDetailMeta}>
                        De: {selectedMessage.from}
                        {selectedMessage.to ? ` · Para: ${selectedMessage.to}` : ''}
                        <br />
                        {formatDate(selectedMessage.date)}
                      </p>
                    </div>
                  </div>
                  <div className={`${styles.mailDetailBody} ${styles.mailDetailBodyTall}`}>
                    {selectedMessage.text}
                  </div>
                </div>

                <div className={styles.replyBox}>
                  <h3 className={styles.replyTitle}>Responder</h3>
                  <label className={styles.replyLabel} htmlFor="reply-to">
                    Para
                  </label>
                  <input
                    id="reply-to"
                    className={styles.replyInput}
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    placeholder="destinatario@email.com"
                    autoComplete="email"
                  />
                  <label className={styles.replyLabel} htmlFor="reply-text">
                    Mensagem
                  </label>
                  <textarea
                    id="reply-text"
                    className={styles.replyTextarea}
                    rows={6}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva a resposta…"
                  />
                  <div className={styles.replyActions}>
                    <button
                      type="button"
                      className={styles.btnGold}
                      disabled={replyBusy}
                      onClick={() => void sendReply()}
                    >
                      {replyBusy ? 'Enviando…' : 'Enviar resposta'}
                    </button>
                    {replyStatus && <span className={styles.replyStatus}>{replyStatus}</span>}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
