"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../admin.module.css";

function CaixaEmailForm() {
  const params = useSearchParams();
  const router = useRouter();
  const para = params.get("para") || "";
  const assunto = params.get("assunto") || "";
  const nome = params.get("nome") || "";
  const cargo = params.get("cargo") || "";
  const vaga = params.get("vaga") || "";
  const candidatura = params.get("candidatura") || "";

  const [to, setTo] = useState(para);
  const [subject, setSubject] = useState(assunto);
  const [text, setText] = useState("");
  const [attachResume, setAttachResume] = useState(Boolean(vaga && candidatura));
  const [from, setFrom] = useState("");
  const [configured, setConfigured] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setTo(para);
    setSubject(assunto);
    setAttachResume(Boolean(vaga && candidatura));
    setText(nome || cargo
      ? `Olá,\n\nSegue o currículo${nome ? ` de ${nome}` : ""}${cargo ? ` para a vaga de ${cargo}` : ""}.\n\nAtenciosamente,\nRecruta Indústria`
      : "");
    setStatus("");
    setError("");
  }, [para, assunto, nome, cargo, vaga, candidatura]);

  useEffect(() => {
    void fetch("/api/admin/caixa-email", { credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          setConfigured(data.configured !== false);
          setFrom(typeof data.from === "string" ? data.from : "");
        }
      })
      .catch(() => undefined);
  }, []);

  async function send() {
    setBusy(true);
    setStatus("");
    setError("");
    try {
      const response = await fetch("/api/admin/caixa-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          text,
          jobId: vaga || undefined,
          applicationId: candidatura || undefined,
          attachResume: attachResume && Boolean(vaga && candidatura),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Não foi possível enviar o e-mail.");
        return;
      }
      setStatus(`E-mail enviado para ${data.to}${data.attached ? ", com o PDF em anexo" : ""}.`);
      setText("");
      setAttachResume(false);
    } catch {
      setError("Erro de rede ao enviar o e-mail.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>CAIXA DE E-MAIL</h1>
          <p className={styles.heroMeta}>
            Escreva e envie daqui. O clique no e-mail de uma vaga já traz o destinatário.
            {from ? ` Remetente: ${from}.` : ""}
          </p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={() => router.push("/admin/caixa-email")}>
            Novo e-mail
          </button>
        </div>
      </div>

      {!configured ? (
        <div className={styles.warnBox}>O envio por e-mail não está configurado neste servidor.</div>
      ) : null}

      <section className={styles.panel}>
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
          {vaga && candidatura ? (
            <label className={styles.replyLabel}>
              <input
                type="checkbox"
                checked={attachResume}
                onChange={(event) => setAttachResume(event.target.checked)}
              />{" "}
              Anexar o PDF desta candidatura
            </label>
          ) : null}
          <div className={styles.replyActions}>
            <button type="button" className={styles.btnGold} disabled={busy} onClick={() => void send()}>
              {busy ? "Enviando..." : "Enviar"}
            </button>
            {status ? <span className={styles.replyStatus}>{status}</span> : null}
            {error ? <span className={styles.mailDetailError}>{error}</span> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function CaixaEmailPage() {
  return (
    <Suspense fallback={<main className={styles.main}><p className={styles.empty}>Abrindo a caixa de e-mail...</p></main>}>
      <CaixaEmailForm />
    </Suspense>
  );
}
