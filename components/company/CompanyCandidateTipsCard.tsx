"use client";
import { localizeServerText } from "@/lib/i18n/server-text";
import { formatUiDateTime } from "@/lib/i18n/format-ui";
import { exactUi } from "@/lib/i18n/exact-ui";

import React, { useState } from "react";
import { botaoPerfil, textoAviso, textoDourado } from "@/lib/ui/perfil-empresa-cores";
import { dashCard, dashInnerBox, dashInput } from "@/lib/dashboard-theme";
import { goldTitle } from "@/components/company/candidate-profile-bits";
import { AVISO_RETENCAO_INBOX } from "@/lib/profile/inbox-retention";

export type TipItem = {
  id: string;
  message: string;
  isAnonymous: boolean;
  rating?: number | null;
  createdAt: string;
};

type Props = {
  profileId: string;
  bloqueado: boolean;
  canSendTips: boolean;
  tips: TipItem[];
  onTipsChange: (next: TipItem[]) => void;
};

export default function CompanyCandidateTipsCard({
  profileId,
  bloqueado,
  canSendTips,
  tips,
  onTipsChange,
}: Props) {
  const [tipText, setTipText] = useState("");
  const [sendingTip, setSendingTip] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const handleSendTip = async () => {
    if (!tipText.trim()) return;
    setSendingTip(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/company/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId, message: tipText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ tone: "err", text: localizeServerText(data.error) || exactUi("Erro ao enviar dica") });
        return;
      }
      const created = data.tip as TipItem | undefined;
      const nova: TipItem = created?.id
        ? {
            id: created.id,
            message: created.message,
            isAnonymous: Boolean(created.isAnonymous),
            rating: created.rating ?? null,
            createdAt: created.createdAt,
          }
        : {
            id: `local-${Date.now()}`,
            message: tipText.trim(),
            isAnonymous: true,
            rating: null,
            createdAt: new Date().toISOString(),
          };
      onTipsChange([nova, ...tips]);
      setTipText("");
      setFeedback({ tone: "ok", text: exactUi("Dica enviada.") });
    } catch {
      setFeedback({ tone: "err", text: exactUi("Erro ao enviar dica") });
    } finally {
      setSendingTip(false);
    }
  };

  const handleExcluirDica = async (tipId: string) => {
    if (!window.confirm(exactUi("Excluir esta dica? Itens com mais de 1 mês também são apagados automaticamente."))) {
      return;
    }
    setFeedback(null);
    try {
      const res = await fetch(`/api/company/tips?id=${encodeURIComponent(tipId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFeedback({ tone: "err", text: localizeServerText(data.error) || exactUi("Não foi possível excluir a dica.") });
        return;
      }
      onTipsChange(tips.filter((t) => t.id !== tipId));
      setFeedback({ tone: "ok", text: exactUi("Dica excluída.") });
    } catch {
      setFeedback({ tone: "err", text: exactUi("Não foi possível excluir a dica.") });
    }
  };

  return (
    <section style={{ ...dashCard, padding: 18 }}>
      <h3 style={{ ...goldTitle, margin: "0 0 8px", fontSize: 16 }}>💡 Dicas enviadas ao candidato</h3>
      <p style={{ fontSize: 11, color: "#000", margin: "0 0 12px", lineHeight: 1.45 }}>
        {exactUi(AVISO_RETENCAO_INBOX)}
      </p>
      {tips.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14, maxHeight: 220, overflowY: "auto" }}>
          {tips.map((tip) => (
            <div
              key={tip.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: 10,
                ...dashInnerBox,
                borderLeft: "3px solid #000",
              }}
            >
              <button
                type="button"
                className="ri-tinta-aviso"
                onClick={() => void handleExcluirDica(tip.id)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(229,115,115,0.55)",
                  ...textoAviso,
                  borderRadius: 8,
                  padding: "4px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0,
                  fontFamily: "inherit",
                }}
                title={exactUi("Excluir dica")}
              >{exactUi("Excluir")}</button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 4px", fontSize: 13, lineHeight: 1.5, color: "#000" }}>{tip.message}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#000" }}>{formatUiDateTime(tip.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#000", margin: "0 0 14px" }}>{exactUi("Nenhuma dica enviada ainda.")}</p>
      )}
      {canSendTips && !bloqueado && (
        <>
          <textarea
            value={tipText}
            onChange={(e) => {
              setTipText(e.target.value);
              if (feedback) setFeedback(null);
            }}
            rows={3}
            maxLength={500}
            placeholder={exactUi("Escreva uma dica anônima para o candidato...")}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 10,
              borderRadius: 8,
              ...dashInput,
              fontSize: 13,
            }}
          />
          {feedback ? (
            <p
              role="status"
              style={{
                margin: "8px 0 0",
                fontSize: 12,
                fontWeight: 700,
                ...(feedback.tone === "ok" ? textoDourado : textoAviso),
                lineHeight: 1.45,
              }}
            >
              {feedback.text}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void handleSendTip()}
            disabled={sendingTip || !tipText.trim()}
            style={{ ...botaoPerfil, width: "100%", marginTop: 8, padding: 10, fontSize: 13, opacity: sendingTip || !tipText.trim() ? 0.7 : 1 }}
          >
            {sendingTip ? exactUi("Enviando...") : exactUi("Enviar dica")}
          </button>
        </>
      )}
      {!(canSendTips && !bloqueado) && feedback ? (
        <p
          role="status"
          style={{
            margin: "8px 0 0",
            fontSize: 12,
            fontWeight: 700,
            ...(feedback.tone === "ok" ? textoDourado : textoAviso),
            lineHeight: 1.45,
          }}
        >
          {feedback.text}
        </p>
      ) : null}
    </section>
  );
}
