"use client";

import React, { useState } from "react";
import { DASH } from "@/lib/dashboard-theme";

type Props = {
  /** compact = botão pequeno no header empresa */
  variant?: "compact" | "card";
};

/**
 * Exclusão da própria conta (profissional ou empresa).
 * Exige digitar EXCLUIR; chama POST /api/account/delete e redireciona para a home.
 */
export default function DeleteAccountControl({ variant = "card" }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = confirmText.trim().toUpperCase() === "EXCLUIR" && !loading;

  const reset = () => {
    setOpen(false);
    setConfirmText("");
    setError(null);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "EXCLUIR" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean };
      if (!res.ok || !data.success) {
        setError(data.error || "Não foi possível excluir o cadastro.");
        setLoading(false);
        return;
      }
      window.location.href = "/api/auth/logout?redirect=/";
    } catch {
      setError("Erro de rede ao excluir o cadastro.");
      setLoading(false);
    }
  };

  const triggerStyle: React.CSSProperties =
    variant === "compact"
      ? {
          padding: "5px 10px",
          fontSize: 10,
          fontWeight: 700,
          color: "#ffcdd2",
          background: "transparent",
          border: "1px solid rgba(229, 57, 53, 0.55)",
          borderRadius: 8,
          cursor: "pointer",
          lineHeight: 1.2,
        }
      : {
          padding: "6px 10px",
          fontSize: 10,
          fontWeight: 700,
          color: "#ffcdd2",
          background: "rgba(229, 57, 53, 0.12)",
          border: "1px solid rgba(229, 57, 53, 0.55)",
          borderRadius: 8,
          cursor: "pointer",
          flexShrink: 0,
        };

  return (
    <div style={{ position: "relative" }}>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} style={triggerStyle}>
          Excluir cadastro
        </button>
      ) : (
        <div
          role="dialog"
          aria-label="Confirmar exclusão de cadastro"
          style={{
            marginTop: variant === "card" ? 0 : 0,
            padding: 12,
            borderRadius: 10,
            border: `1px solid rgba(229, 57, 53, 0.55)`,
            background: "rgba(20, 20, 20, 0.92)",
            minWidth: variant === "compact" ? 260 : "100%",
            maxWidth: 360,
            boxSizing: "border-box",
            ...(variant === "compact"
              ? {
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: 8,
                  zIndex: 40,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                }
              : { marginTop: 10 }),
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: 12, color: DASH.text || "#F2F2F2", lineHeight: 1.45 }}>
            Isso apaga permanentemente sua conta e dados. Digite <strong>EXCLUIR</strong> para confirmar.
          </p>
          <label htmlFor="delete-account-confirm" style={{ display: "block", fontSize: 10, color: DASH.muted, marginBottom: 4 }}>
            Confirmação
          </label>
          <input
            id="delete-account-confirm"
            type="text"
            autoComplete="off"
            placeholder="EXCLUIR"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={loading}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 10px",
              borderRadius: 8,
              border: `1px solid ${DASH.border}`,
              background: "#111",
              color: "#F2F2F2",
              fontSize: 13,
              marginBottom: 8,
            }}
          />
          {error && (
            <p style={{ margin: "0 0 8px", fontSize: 11, color: "#ffcdd2", lineHeight: 1.4 }}>{error}</p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              disabled={loading}
              style={{
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 600,
                color: DASH.muted,
                background: "transparent",
                border: `1px solid ${DASH.border}`,
                borderRadius: 8,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={!canSubmit}
              style={{
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 700,
                color: canSubmit ? "#fff" : "#888",
                background: canSubmit ? "#c62828" : "rgba(198, 40, 40, 0.35)",
                border: "1px solid #b71c1c",
                borderRadius: 8,
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Excluindo…" : "Excluir definitivamente"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
