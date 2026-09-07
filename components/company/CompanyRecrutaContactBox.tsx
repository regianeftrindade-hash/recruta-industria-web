"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { DASH, dashInnerBox, dashInput, dashLabel, dashSectionTitle } from "@/lib/dashboard-theme";

type Props = {
  /** true = plano pago (Basic+); false = Free (mostra bloqueio) */
  unlocked?: boolean;
};

export function CompanyRecrutaContactBox({ unlocked = false }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSend = async () => {
    if (!unlocked) {
      setFeedback({
        ok: false,
        text: "Disponível apenas nos planos pagos (Basic, Premium e Empresarial).",
      });
      return;
    }

    const assunto = subject.trim();
    const texto = message.trim();

    if (assunto.length < 3) {
      setFeedback({ ok: false, text: "Informe um assunto com pelo menos 3 caracteres." });
      return;
    }
    if (texto.length < 5) {
      setFeedback({ ok: false, text: "Escreva a mensagem com pelo menos 5 caracteres." });
      return;
    }

    setSending(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/company/contact-recruta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject: assunto, message: texto }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ ok: false, text: data.error || "Erro ao enviar mensagem." });
        return;
      }
      setSubject("");
      setMessage("");
      setFeedback({
        ok: true,
        text: data.warning
          || "Mensagem enviada. A Recruta Indústria recebe na caixa de e-mail e pode responder pelo seu e-mail.",
      });
    } catch {
      setFeedback({ ok: false, text: "Erro de rede ao enviar." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 14,
        paddingTop: 12,
        borderTop: `1px solid ${DASH.border}`,
        position: "relative",
        zIndex: 2,
      }}
    >
      <h4 style={{ ...dashSectionTitle, margin: "0 0 6px", fontSize: 12 }}>📬 Contato Recruta Indústria</h4>

      <p style={{ color: DASH.muted, fontSize: 9, margin: "0 0 8px", lineHeight: 1.45 }}>
        {unlocked
          ? "Funcionalidade dos planos pagos (Basic, Premium e Empresarial). Sua mensagem chega no e-mail da Recruta Indústria."
          : "Exclusivo dos planos pagos (Basic, Premium e Empresarial): caixa de e-mail aberta para falar direto com a equipe Recruta Indústria."}
      </p>

      <div
        style={{
          ...dashInnerBox,
          padding: 8,
          position: "relative",
          zIndex: 2,
          opacity: unlocked ? 1 : 0.85,
        }}
      >
        {!unlocked ? (
          <>
            <p style={{ margin: "0 0 8px", fontSize: 10, color: DASH.text, lineHeight: 1.45 }}>
              🔒 No plano Free esta caixa fica bloqueada. Assine um plano pago para enviar mensagens direto para o e-mail da Recruta.
            </p>
            <button
              type="button"
              onClick={() => router.push("/company/pagamento?plan=BASIC")}
              style={{
                ...btnGold,
                width: "100%",
                padding: "8px 10px",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Ver planos pagos
            </button>
          </>
        ) : (
          <>
            <label style={{ ...dashLabel, display: "block", marginBottom: 4, fontSize: 9 }}>Assunto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (feedback && !feedback.ok) setFeedback(null);
              }}
              maxLength={120}
              placeholder="Ex.: Dúvida sobre liberações"
              style={{ ...dashInput, fontSize: 10, marginBottom: 8, pointerEvents: "auto" }}
            />

            <label style={{ ...dashLabel, display: "block", marginBottom: 4, fontSize: 9 }}>Mensagem</label>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (feedback && !feedback.ok) setFeedback(null);
              }}
              maxLength={4000}
              rows={5}
              placeholder="Escreva sua mensagem para a Recruta Indústria..."
              style={{
                ...dashInput,
                fontSize: 10,
                resize: "vertical",
                minHeight: 90,
                marginBottom: 8,
                lineHeight: 1.45,
                pointerEvents: "auto",
              }}
            />

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleSend();
              }}
              disabled={sending}
              style={{
                ...btnGold,
                width: "100%",
                padding: "8px 10px",
                fontSize: 11,
                cursor: sending ? "wait" : "pointer",
                pointerEvents: "auto",
                position: "relative",
                zIndex: 3,
                opacity: sending ? 0.75 : 1,
              }}
            >
              {sending ? "Enviando..." : "Enviar para a Recruta"}
            </button>
          </>
        )}

        {feedback && (
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 9,
              lineHeight: 1.4,
              color: feedback.ok ? DASH.gold : "#f87171",
            }}
          >
            {feedback.text}
          </p>
        )}
      </div>
    </div>
  );
}
