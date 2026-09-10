"use client";

import React, { useState } from "react";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { DASH, dashCard, dashGhostBtn, dashInnerBox, dashInput } from "@/lib/dashboard-theme";
import { goldTitle } from "@/components/company/candidate-profile-bits";

type NotaInterna = {
  id: string;
  text: string;
  createdAt: string;
};

export function parseNotasInternas(raw: string): NotaInterna[] {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item) => ({
          id: String(item.id || `${Date.now()}`),
          text: String(item.text || "").trim(),
          createdAt: String(item.createdAt || new Date().toISOString()),
        }))
        .filter((item) => item.text);
    }
  } catch {
    /* texto antigo em um único bloco */
  }
  return [{ id: "legado", text: trimmed, createdAt: new Date().toISOString() }];
}

type Props = {
  profileId: string;
  notes: string;
  onNotesChange: (notes: string) => void;
};

export default function CompanyCandidateNotesCard({ profileId, notes, onNotesChange }: Props) {
  const [notaTexto, setNotaTexto] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const salvar = async (patchNotes: string) => {
    setSavingNotes(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/company/professionals/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes: patchNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ tone: "err", text: data.error || "Erro ao salvar" });
        return false;
      }
      onNotesChange(String(data.tracking?.notes || patchNotes));
      return true;
    } catch {
      setFeedback({ tone: "err", text: "Erro ao salvar anotações" });
      return false;
    } finally {
      setSavingNotes(false);
    }
  };

  const salvarNotaInterna = async () => {
    const text = notaTexto.trim();
    if (!text) {
      setFeedback({ tone: "err", text: "Escreva a anotação antes de salvar." });
      return;
    }
    const atuais = parseNotasInternas(notes);
    const nova: NotaInterna = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `n-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
    };
    const ok = await salvar(JSON.stringify([nova, ...atuais]));
    if (ok) {
      setNotaTexto("");
      setFeedback({ tone: "ok", text: "Anotação salva." });
    }
  };

  const apagarNotaInterna = async (id: string) => {
    if (!confirm("Apagar esta anotação?")) return;
    const atuais = parseNotasInternas(notes).filter((n) => n.id !== id);
    const ok = await salvar(atuais.length ? JSON.stringify(atuais) : "");
    if (ok) setFeedback({ tone: "ok", text: "Anotação apagada." });
  };

  return (
    <section style={{ ...dashCard, padding: 18, minWidth: 0, maxWidth: "100%", boxSizing: "border-box" }}>
      <h3 style={{ ...goldTitle, margin: "0 0 8px", fontSize: 16 }}>📝 Anotações internas</h3>
      <p style={{ margin: "0 0 10px", fontSize: 11, color: DASH.muted, lineHeight: 1.4 }}>
        Visível só para a sua empresa. Salve para virar um card. Use Apagar para remover.
      </p>
      <textarea
        value={notaTexto}
        onChange={(e) => {
          setNotaTexto(e.target.value);
          if (feedback) setFeedback(null);
        }}
        rows={4}
        placeholder="Escreva uma observação sobre este candidato..."
        style={{
          width: "100%",
          boxSizing: "border-box",
          marginTop: 6,
          padding: 12,
          borderRadius: 8,
          ...dashInput,
          border: `1px solid ${DASH.gold}`,
          fontSize: 14,
          lineHeight: 1.5,
          resize: "vertical",
        }}
      />
      {feedback ? (
        <p
          role="status"
          style={{
            margin: "8px 0 0",
            fontSize: 12,
            fontWeight: 700,
            color: feedback.tone === "ok" ? "#8bc34a" : "#e57373",
            lineHeight: 1.45,
          }}
        >
          {feedback.text}
        </p>
      ) : null}
      <button
        type="button"
        disabled={savingNotes || !notaTexto.trim()}
        onClick={() => void salvarNotaInterna()}
        style={{
          ...btnGold,
          width: "100%",
          marginTop: 8,
          padding: 10,
          fontSize: 13,
          opacity: savingNotes || !notaTexto.trim() ? 0.7 : 1,
        }}
      >
        {savingNotes ? "Salvando..." : "Salvar"}
      </button>
      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        {parseNotasInternas(notes).map((nota) => (
          <div
            key={nota.id}
            style={{
              ...dashInnerBox,
              padding: 12,
              border: `1px solid ${DASH.gold}`,
              borderRadius: 10,
              minWidth: 0,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: DASH.text,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {nota.text}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 10, color: DASH.muted }}>
              {new Date(nota.createdAt).toLocaleString("pt-BR")}
            </p>
            <button
              type="button"
              disabled={savingNotes}
              onClick={() => void apagarNotaInterna(nota.id)}
              style={{
                ...dashGhostBtn,
                marginTop: 8,
                padding: "5px 8px",
                fontSize: 10,
                color: "#e57373",
                borderColor: "rgba(229,115,115,0.55)",
              }}
            >
              Apagar
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
