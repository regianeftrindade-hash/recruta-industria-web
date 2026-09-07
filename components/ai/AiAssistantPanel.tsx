"use client";

import React, { useCallback, useEffect, useState } from "react";
import { isAiUiEnabled } from "@/lib/ai/public-flags";

type UsageInfo = {
  enabled: boolean;
  reasonDisabled?: string | null;
  capability: string;
  mode: string;
  planLabel: string;
  usage: { used: number; limit: number; remaining: number; periodKey: string };
};

type Props = {
  /** Contexto opcional (perfil, filtros) enviado à IA — sem inventar dados */
  context?: Record<string, unknown> | null;
  placeholder?: string;
  title?: string;
};

/**
 * Painel legado de chat genérico — oculto com NEXT_PUBLIC_ENABLE_AI=false.
 * Preferir ImprovePresentationSuggest / rotas específicas.
 */
export default function AiAssistantPanel({
  context = null,
  placeholder = "Pergunte ao assistente…",
  title = "Assistente Recruta",
}: Props) {
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = isAiUiEnabled();

  const loadUsage = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/ai/usage", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setUsage(data);
    } catch {
      /* ignore */
    }
  }, [enabled]);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  if (!enabled) return null;

  const send = async () => {
    const text = message.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId, context }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao consultar a IA");
        return;
      }
      // IA desligada / sem chave: available=false + reply amigável (não é erro)
      setReply(String(data.reply || data.notice || ""));
      if (data.available !== false) {
        setConversationId(data.conversationId || null);
        setMessage("");
      }
      if (data.usage) {
        setUsage((prev) =>
          prev
            ? {
                ...prev,
                enabled: data.available !== false,
                usage: data.usage,
              }
            : prev,
        );
      }
      void loadUsage();
    } catch {
      setError("Erro de rede");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      style={{
        border: "1px solid #8D6B1F",
        borderRadius: 14,
        padding: 14,
        background: "#2b2b2b",
        color: "#f2f2f2",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, color: "#C89B3C" }}>{title}</h3>
        {usage ? (
          <span style={{ fontSize: 11, color: "#bdbdbd" }}>
            {usage.usage.remaining}/{usage.usage.limit} usos no mês · {usage.planLabel}
          </span>
        ) : null}
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 11, color: "#bdbdbd", lineHeight: 1.45 }}>
        A IA sugere e organiza. Decisões (convidar, classificar, contratar) são sempre suas.
      </p>

      {usage && !usage.enabled ? (
        <p style={{ margin: 0, fontSize: 12, color: "#e57373" }}>
          {usage.reasonDisabled || "IA indisponível."}
        </p>
      ) : (
        <>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder={placeholder}
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 10,
              border: "1px solid #4a4a4a",
              background: "#1f1f1f",
              color: "#f2f2f2",
              padding: 10,
              fontSize: 13,
              resize: "vertical",
            }}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !message.trim()}
            style={{
              marginTop: 8,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #6b5218",
              background: "linear-gradient(180deg, #8D6B1F 0%, #C89B3C 45%, #A87E2E 100%)",
              color: "#000",
              fontWeight: 700,
              fontSize: 12,
              cursor: loading ? "wait" : "pointer",
              opacity: loading || !message.trim() ? 0.7 : 1,
            }}
          >
            {loading ? "Pensando…" : "Enviar"}
          </button>
        </>
      )}

      {error ? (
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#e57373" }}>{error}</p>
      ) : null}

      {reply ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            background: "#1a1a1a",
            border: "1px solid #4a4a4a",
            fontSize: 13,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          {reply}
        </div>
      ) : null}
    </section>
  );
}
