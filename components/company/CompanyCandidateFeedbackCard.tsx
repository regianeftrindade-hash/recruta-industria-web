"use client";

import React, { useCallback, useEffect, useState } from "react";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { DASH, dashCard, dashInnerBox, dashInput } from "@/lib/dashboard-theme";
import { goldTitle } from "@/components/company/candidate-profile-bits";

type FeedbackItem = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  mine?: boolean;
};

export default function CompanyCandidateFeedbackCard({ profileId }: { profileId: string }) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const carregarFeedbacks = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/company/profile-feedback?profileId=${encodeURIComponent(profileId)}`,
        { credentials: "include" },
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.feedbacks)) {
        setFeedbacks(data.feedbacks);
      }
    } catch {
      /* ignore */
    }
  }, [profileId]);

  useEffect(() => {
    void carregarFeedbacks();
  }, [carregarFeedbacks]);

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    setSendingFeedback(true);
    setFeedbackMsg("");
    try {
      const res = await fetch("/api/company/profile-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId, body: feedbackText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedbackMsg(data.error || "Não foi possível enviar o feedback.");
        return;
      }
      if (Array.isArray(data.feedbacks)) setFeedbacks(data.feedbacks);
      setFeedbackText("");
    } catch {
      setFeedbackMsg("Erro de rede ao enviar o feedback.");
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleExcluirFeedback = async (feedbackId: string) => {
    if (!window.confirm("Excluir este feedback?")) return;
    setDeletingFeedbackId(feedbackId);
    setFeedbackMsg("");
    try {
      const res = await fetch("/api/company/profile-feedback", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: feedbackId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedbackMsg(data.error || "Não foi possível excluir o feedback.");
        return;
      }
      if (Array.isArray(data.feedbacks)) setFeedbacks(data.feedbacks);
    } catch {
      setFeedbackMsg("Erro de rede ao excluir o feedback.");
    } finally {
      setDeletingFeedbackId(null);
    }
  };

  return (
    <section style={{ ...dashCard, padding: 18 }}>
      <h3 style={{ ...goldTitle, margin: "0 0 12px", fontSize: 16 }}>💬 Feedback da equipe</h3>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: DASH.muted, lineHeight: 1.45 }}>
        Todos da mesma assinatura veem os feedbacks deixados sobre este candidato.
      </p>

      <div
        style={{
          ...dashInnerBox,
          padding: 10,
          border: `1px solid ${DASH.gold}`,
          display: "grid",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Escreva seu feedback sobre o candidato..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 8,
            borderRadius: 8,
            ...dashInput,
            fontSize: 12,
            lineHeight: 1.5,
            resize: "vertical",
          }}
        />
        {feedbackMsg ? (
          <p style={{ margin: 0, fontSize: 11, color: "#f87171" }}>{feedbackMsg}</p>
        ) : null}
        <button
          type="button"
          onClick={() => void handleSendFeedback()}
          disabled={sendingFeedback || !feedbackText.trim()}
          style={{
            ...btnGold,
            padding: "6px 12px",
            fontSize: 12,
            width: "fit-content",
            justifySelf: "end",
            opacity: sendingFeedback || !feedbackText.trim() ? 0.7 : 1,
          }}
        >
          {sendingFeedback ? "Enviando..." : "Enviar feedback"}
        </button>
      </div>

      {feedbacks.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>
          Nenhum feedback ainda. Seja o primeiro a avaliar.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 8, maxHeight: 320, overflowY: "auto" }}>
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              style={{
                ...dashInnerBox,
                padding: "8px 10px",
                borderRadius: 8,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              {fb.mine ? (
                <button
                  type="button"
                  disabled={deletingFeedbackId === fb.id}
                  onClick={() => void handleExcluirFeedback(fb.id)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(229,115,115,0.55)",
                    color: "#e57373",
                    borderRadius: 8,
                    padding: "4px 8px",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: deletingFeedbackId === fb.id ? "wait" : "pointer",
                    flexShrink: 0,
                    fontFamily: "inherit",
                    opacity: deletingFeedbackId === fb.id ? 0.7 : 1,
                  }}
                  title="Excluir meu feedback"
                >
                  Excluir
                </button>
              ) : null}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <strong style={{ fontSize: 12, color: DASH.gold }}>{fb.authorName}</strong>
                  <span style={{ fontSize: 10, color: DASH.muted, flexShrink: 0 }}>
                    {new Date(fb.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: DASH.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {fb.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
