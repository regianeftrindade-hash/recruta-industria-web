"use client";

import React, { useState } from "react";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { DASH, dashCard, dashInput } from "@/lib/dashboard-theme";
import { goldTitle } from "@/components/company/candidate-profile-bits";
import { AVISO_RETENCAO_INBOX } from "@/lib/profile/inbox-retention";

export type ConversaItem = {
  id: string;
  from: string;
  body: string;
  createdAt: string;
  senderRole: "COMPANY" | "PROFESSIONAL";
};

type Props = {
  profileId: string;
  bloqueado: boolean;
  conversa: ConversaItem[];
  onConversaChange: (next: ConversaItem[]) => void;
  onReload: () => Promise<void>;
};

export default function CompanyCandidateMessagesCard({
  profileId,
  bloqueado,
  conversa,
  onConversaChange,
  onReload,
}: Props) {
  const [mensagemTexto, setMensagemTexto] = useState("");
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);

  const handleExcluirMensagem = async (messageId: string) => {
    if (!window.confirm("Excluir esta mensagem? Itens com mais de 1 mês também são apagados automaticamente.")) {
      return;
    }
    try {
      const res = await fetch(
        `/api/company/messages?id=${encodeURIComponent(messageId)}&profileId=${encodeURIComponent(profileId)}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Não foi possível excluir a mensagem.");
        return;
      }
      onConversaChange(conversa.filter((m) => m.id !== messageId));
    } catch {
      alert("Não foi possível excluir a mensagem.");
    }
  };

  const handleSendMessage = async () => {
    const text = mensagemTexto.trim();
    if (!text) return;
    setEnviandoMensagem(true);
    try {
      const res = await fetch("/api/company/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId, body: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao enviar mensagem");
        return;
      }
      setMensagemTexto("");
      await onReload();
      alert("Mensagem enviada! O candidato verá no painel dele e poderá responder.");
    } catch {
      alert("Erro ao enviar mensagem");
    } finally {
      setEnviandoMensagem(false);
    }
  };

  return (
    <section style={{ ...dashCard, padding: 18 }}>
      <h3 style={{ ...goldTitle, margin: "0 0 12px", fontSize: 16 }}>✉️ Mensagem para o candidato</h3>
      <p style={{ fontSize: 11, color: DASH.muted, margin: "0 0 10px", lineHeight: 1.45 }}>
        {AVISO_RETENCAO_INBOX}
      </p>
      {bloqueado ? (
        <p style={{ fontSize: 13, color: DASH.muted, margin: 0 }}>
          Libere o contato para enviar mensagem direta ao profissional.
        </p>
      ) : (
        <>
          <p style={{ fontSize: 12, color: DASH.muted, margin: "0 0 10px", lineHeight: 1.45 }}>
            A mensagem aparece na caixa de entrada do candidato. Ele pode ler e responder por lá.
          </p>

          {conversa.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                maxHeight: 240,
                overflowY: "auto",
                marginBottom: 12,
              }}
            >
              {conversa.map((m) => {
                const isProf = m.senderRole === "PROFESSIONAL";
                const quando = new Date(m.createdAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: `1px solid ${DASH.gold}`,
                      background: isProf ? "rgba(200,155,60,0.12)" : DASH.inner,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => void handleExcluirMensagem(m.id)}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(229,115,115,0.55)",
                        color: "#e57373",
                        borderRadius: 8,
                        padding: "4px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                        flexShrink: 0,
                        fontFamily: "inherit",
                      }}
                      title="Excluir mensagem"
                    >
                      Excluir
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 10,
                          fontWeight: 700,
                          color: isProf ? DASH.gold : DASH.muted,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {isProf ? m.from || "Profissional" : "Você"} · {quando}
                      </p>
                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: 12,
                          lineHeight: 1.4,
                          color: DASH.text,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={m.body}
                      >
                        {m.body}
                      </p>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 10,
                        fontWeight: 700,
                        color: isProf ? DASH.gold : DASH.muted,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isProf ? "Recebida" : "Enviada"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <textarea
            value={mensagemTexto}
            onChange={(e) => setMensagemTexto(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Escreva sua mensagem para o profissional..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 10,
              borderRadius: 8,
              ...dashInput,
              fontSize: 13,
              lineHeight: 1.5,
              resize: "vertical",
            }}
          />
          <button
            type="button"
            onClick={() => void handleSendMessage()}
            disabled={enviandoMensagem || !mensagemTexto.trim()}
            style={{
              ...btnGold,
              width: "100%",
              marginTop: 8,
              padding: 10,
              fontSize: 13,
              opacity: enviandoMensagem || !mensagemTexto.trim() ? 0.7 : 1,
            }}
          >
            {enviandoMensagem ? "Enviando..." : "Enviar mensagem"}
          </button>
        </>
      )}
    </section>
  );
}
