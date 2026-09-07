"use client";

import React, { useState } from "react";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { DASH, dashCard, dashInnerBox, dashInput } from "@/lib/dashboard-theme";
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
  onReload: () => Promise<void>;
};

export default function CompanyCandidateTipsCard({
  profileId,
  bloqueado,
  canSendTips,
  tips,
  onTipsChange,
  onReload,
}: Props) {
  const [tipText, setTipText] = useState("");
  const [sendingTip, setSendingTip] = useState(false);

  const handleSendTip = async () => {
    if (!tipText.trim()) return;
    setSendingTip(true);
    try {
      const res = await fetch("/api/company/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId, message: tipText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao enviar dica");
        return;
      }
      setTipText("");
      await onReload();
    } catch {
      alert("Erro ao enviar dica");
    } finally {
      setSendingTip(false);
    }
  };

  const handleExcluirDica = async (tipId: string) => {
    if (!window.confirm("Excluir esta dica? Itens com mais de 1 mês também são apagados automaticamente.")) {
      return;
    }
    try {
      const res = await fetch(`/api/company/tips?id=${encodeURIComponent(tipId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Não foi possível excluir a dica.");
        return;
      }
      onTipsChange(tips.filter((t) => t.id !== tipId));
    } catch {
      alert("Não foi possível excluir a dica.");
    }
  };

  return (
    <section style={{ ...dashCard, padding: 18 }}>
      <h3 style={{ ...goldTitle, margin: "0 0 8px", fontSize: 16 }}>💡 Dicas enviadas ao candidato</h3>
      <p style={{ fontSize: 11, color: DASH.muted, margin: "0 0 12px", lineHeight: 1.45 }}>
        {AVISO_RETENCAO_INBOX}
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
                borderLeft: `3px solid ${DASH.gold}`,
              }}
            >
              <button
                type="button"
                onClick={() => void handleExcluirDica(tip.id)}
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
                title="Excluir dica"
              >
                Excluir
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 4px", fontSize: 13, lineHeight: 1.5, color: DASH.text }}>{tip.message}</p>
                <p style={{ margin: 0, fontSize: 11, color: DASH.muted }}>{new Date(tip.createdAt).toLocaleString("pt-BR")}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: DASH.muted, margin: "0 0 14px" }}>Nenhuma dica enviada ainda.</p>
      )}
      {canSendTips && !bloqueado && (
        <>
          <textarea
            value={tipText}
            onChange={(e) => setTipText(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Escreva uma dica anônima para o candidato..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 10,
              borderRadius: 8,
              ...dashInput,
              fontSize: 13,
            }}
          />
          <button
            type="button"
            onClick={() => void handleSendTip()}
            disabled={sendingTip || !tipText.trim()}
            style={{ ...btnGold, width: "100%", marginTop: 8, padding: 10, fontSize: 13, opacity: sendingTip || !tipText.trim() ? 0.7 : 1 }}
          >
            {sendingTip ? "Enviando..." : "Enviar dica"}
          </button>
        </>
      )}
    </section>
  );
}
