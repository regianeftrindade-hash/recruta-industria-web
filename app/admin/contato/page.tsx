'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
      timeZone: 'America/Sao_Paulo',
    });
  } catch {
    return '—';
  }
}

function CaixaEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const para = params.get('para') || '';
  const assunto = params.get('assunto') || '';
  const nome = params.get('nome') || '';
  const cargo = params.get('cargo') || '';
  const vaga = params.get('vaga') || '';
  const candidatura = params.get('candidatura') || '';

  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [mailbox, setMailbox] = useState<string | null>(null);
  const [fromAddress, setFromAddress] = useState('');
  const [inboxError, setInboxError] = useState('');
  const [inboxConfigured, setInboxConfigured] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessageDetail | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [composing, setComposing] = useState(Boolean(para));
  const [to, setTo] = useState(para);
  const [subject, setSubject] = useState(assunto);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [replyText, setReplyText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [attachResume, setAttachResume] = useState(Boolean(vaga && candidatura));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const loadInbox = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inbox?limit=40&todas=1', { credentials: 'include' });
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
    void fetch('/api/admin/caixa-email', { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          setSmtpConfigured(data.configured !== false);
          setFromAddress(typeof data.from === 'string' ? data.from : '');
        }
      })
      .catch(() => undefined);
  }, [loadInbox]);

  useEffect(() => {
    if (!para && !assunto) return;
    setComposing(true);
    setSelectedUid(null);
    setSelectedMessage(null);
    setTo(para);
    setSubject(assunto);
    setAttachResume(Boolean(vaga && candidatura));
    setText(nome || cargo
      ? `Olá,\n\nSegue o currículo${nome ? ` de ${nome}` : ''}${cargo ? ` para a vaga de ${cargo}` : ''}.\n\nAtenciosamente,\nRecruta Indústria`
      : '');
    setStatus('');
  }, [para, assunto, nome, cargo, vaga, candidatura]);

  const openMessage = async (uid: number) => {
    setComposing(false);
    setSelectedUid(uid);
    setMessageLoading(true);
    setMessageError('');
    setSelectedMessage(null);
    setReplyText('');
    setReplyFiles([]);
    setStatus('');
    try {
      const res = await fetch(`/api/admin/inbox?uid=${uid}&todas=1`, { credentials: 'include' });
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

  function takeFiles(list: FileList | null, current: File[], set: (files: File[]) => void) {
    const next = [...current];
    for (const file of Array.from(list || [])) {
      if (next.length >= 4) break;
      next.push(file);
    }
    set(next);
  }

  async function sendMail(input: {
    to: string;
    subject: string;
    text: string;
    files: File[];
    uid?: number;
    attachResume?: boolean;
  }) {
    const body = new FormData();
    body.set('to', input.to.trim());
    body.set('subject', input.subject.trim());
    body.set('text', input.text.trim());
    if (input.uid) body.set('uid', String(input.uid));
    if (input.attachResume && vaga && candidatura) {
      body.set('attachResume', '1');
      body.set('jobId', vaga);
      body.set('applicationId', candidatura);
    }
    for (const file of input.files) body.append('arquivos', file);
    const response = await fetch('/api/admin/caixa-email', {
      method: 'POST',
      credentials: 'include',
      body,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Não foi possível enviar o e-mail.');
    }
    return data as { to?: string; attached?: boolean };
  }

  const sendNew = async () => {
    setBusy(true);
    setStatus('');
    try {
      const data = await sendMail({ to, subject, text, files, attachResume });
      setStatus(`E-mail enviado para ${data.to || to}${data.attached ? ', com anexo' : ''}.`);
      setText('');
      setFiles([]);
      setAttachResume(false);
    } catch (sendError) {
      setStatus(sendError instanceof Error ? sendError.message : 'Erro de rede ao enviar o e-mail.');
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!selectedUid) return;
    setBusy(true);
    setStatus('');
    try {
      const data = await sendMail({
        to: replyTo,
        subject: '',
        text: replyText,
        files: replyFiles,
        uid: selectedUid,
      });
      setStatus(`Resposta enviada para ${data.to || replyTo}${data.attached ? ', com anexo' : ''}.`);
      setReplyText('');
      setReplyFiles([]);
    } catch (sendError) {
      setStatus(sendError instanceof Error ? sendError.message : 'Erro de rede ao enviar a resposta.');
    } finally {
      setBusy(false);
    }
  };

  const unread = messages.filter((message) => !message.seen).length;

  function startNew() {
    setComposing(true);
    setSelectedUid(null);
    setSelectedMessage(null);
    setTo('');
    setSubject('');
    setText('');
    setFiles([]);
    setAttachResume(false);
    setStatus('');
    router.replace('/admin/contato');
  }

  return (
    <div className={styles.main}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>CAIXA DE E-MAIL</h1>
          <p className={styles.heroMeta}>
            Leia, responda e envie por aqui.
            {mailbox ? ` Caixa: ${mailbox}.` : ''}
            {fromAddress ? ` Remetente: ${fromAddress}.` : ''}
            {unread > 0 ? ` ${unread} não lida${unread === 1 ? '' : 's'}.` : ''}
          </p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={startNew}>
            Novo e-mail
          </button>
          <button type="button" className={styles.btnGold} onClick={() => void loadInbox()}>
            Atualizar
          </button>
        </div>
      </div>

      {!smtpConfigured ? (
        <div className={styles.warnBox}>O envio por e-mail não está configurado neste servidor.</div>
      ) : null}

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
              <p className={styles.empty}>A caixa não tem mensagens recentes.</p>
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
            {composing ? (
              <div className={styles.replyBox}>
                <h2 className={styles.replyTitle}>Enviar e-mail</h2>
                <label className={styles.replyLabel} htmlFor="caixa-para">Para</label>
                <input
                  id="caixa-para"
                  className={styles.replyInput}
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  placeholder="destinatario@email.com"
                  autoComplete="email"
                  inputMode="email"
                />
                <label className={styles.replyLabel} htmlFor="caixa-assunto">Assunto</label>
                <input
                  id="caixa-assunto"
                  className={styles.replyInput}
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Assunto"
                  maxLength={180}
                />
                <label className={styles.replyLabel} htmlFor="caixa-mensagem">Mensagem</label>
                <textarea
                  id="caixa-mensagem"
                  className={styles.replyTextarea}
                  rows={10}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Escreva a mensagem"
                  maxLength={8000}
                />
                <label className={styles.replyLabel} htmlFor="caixa-anexo">
                  Anexos
                  <input
                    id="caixa-anexo"
                    type="file"
                    multiple
                    accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(event) => {
                      takeFiles(event.target.files, files, setFiles);
                      event.target.value = '';
                    }}
                  />
                </label>
                {files.length > 0 ? (
                  <ul className={styles.candidateLines}>
                    {files.map((file, index) => (
                      <li key={`${file.name}-${index}`} className={styles.candidateLine}>
                        <span>{file.name}</span>
                        <button
                          type="button"
                          className={styles.btnGhost}
                          onClick={() => setFiles((current) => current.filter((_, item) => item !== index))}
                        >
                          Tirar
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.panelSub}>PDF, DOCX, JPG ou PNG. Até 4 arquivos, 8 MB cada.</p>
                )}
                {vaga && candidatura ? (
                  <label className={styles.replyLabel}>
                    <input
                      type="checkbox"
                      checked={attachResume}
                      onChange={(event) => setAttachResume(event.target.checked)}
                    />{' '}
                    Anexar o PDF desta candidatura
                  </label>
                ) : null}
                <div className={styles.replyActions}>
                  <button type="button" className={styles.btnGold} disabled={busy} onClick={() => void sendNew()}>
                    {busy ? 'Enviando…' : 'Enviar'}
                  </button>
                  {status ? <span className={styles.replyStatus}>{status}</span> : null}
                </div>
              </div>
            ) : (
              <>
                <div className={styles.panelHead}>
                  <div>
                    <h2 className={styles.panelTitle}>Mensagem</h2>
                    <p className={styles.panelSub}>
                      {selectedMessage ? 'Leitura e resposta' : 'Selecione um e-mail à esquerda ou escreva um novo'}
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
                      <label className={styles.replyLabel} htmlFor="reply-to">Para</label>
                      <input
                        id="reply-to"
                        className={styles.replyInput}
                        value={replyTo}
                        onChange={(event) => setReplyTo(event.target.value)}
                        placeholder="destinatario@email.com"
                        autoComplete="email"
                      />
                      <label className={styles.replyLabel} htmlFor="reply-text">Mensagem</label>
                      <textarea
                        id="reply-text"
                        className={styles.replyTextarea}
                        rows={6}
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        placeholder="Escreva a resposta…"
                      />
                      <label className={styles.replyLabel} htmlFor="reply-anexo">
                        Anexos
                        <input
                          id="reply-anexo"
                          type="file"
                          multiple
                          accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          onChange={(event) => {
                            takeFiles(event.target.files, replyFiles, setReplyFiles);
                            event.target.value = '';
                          }}
                        />
                      </label>
                      {replyFiles.length > 0 ? (
                        <ul className={styles.candidateLines}>
                          {replyFiles.map((file, index) => (
                            <li key={`${file.name}-${index}`} className={styles.candidateLine}>
                              <span>{file.name}</span>
                              <button
                                type="button"
                                className={styles.btnGhost}
                                onClick={() => setReplyFiles((current) => current.filter((_, item) => item !== index))}
                              >
                                Tirar
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={styles.panelSub}>PDF, DOCX, JPG ou PNG. Até 4 arquivos, 8 MB cada.</p>
                      )}
                      <div className={styles.replyActions}>
                        <button type="button" className={styles.btnGold} disabled={busy} onClick={() => void sendReply()}>
                          {busy ? 'Enviando…' : 'Enviar resposta'}
                        </button>
                        {status ? <span className={styles.replyStatus}>{status}</span> : null}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function AdminContatoPage() {
  return (
    <Suspense fallback={<div className={styles.main}><p className={styles.empty}>Abrindo a caixa de e-mail…</p></div>}>
      <CaixaEmailPage />
    </Suspense>
  );
}
