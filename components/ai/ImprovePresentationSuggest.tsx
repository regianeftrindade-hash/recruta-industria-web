"use client";

import React, { useState } from "react";
import { isAiUiEnabled } from "@/lib/ai/public-flags";

type Props = {
  /** Texto atual do campo (controlado pelo formulário pai) */
  text: string;
  /** Chamado só após o usuário escolher uma sugestão (confirmação explícita) */
  onApplySuggestion: (suggestion: string) => void;
};

/**
 * Sugestões de apresentação profissional.
 * Oculto quando NEXT_PUBLIC_ENABLE_AI=false.
 * Não grava sozinho — exige confirmação via onApplySuggestion.
 * Não está ligado às páginas bloqueadas; importe onde for autorizado.
 */
export default function ImprovePresentationSuggest({ text, onApplySuggestion }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isAiUiEnabled()) return null;

  const run = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/ai/professional/improve-presentation", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.available === false || data.code === "AI_DISABLED" || data.code === "AI_NOT_CONFIGURED") {
        setNotice(data.reply || data.error || "IA indisponível no momento.");
        setSuggestions([]);
        return;
      }
      if (!res.ok || !data.ok) {
        setError(data.error || "Falha ao gerar sugestões");
        return;
      }
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      setNotice(data.notice || "Escolha uma sugestão para aplicar.");
    } catch {
      setError("Erro de rede");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <button type="button" onClick={() => void run()} disabled={loading || !text.trim()}>
        {loading ? "Gerando…" : "Sugerir melhorias com IA"}
      </button>
      {notice ? <p style={{ fontSize: 13, color: "#666" }}>{notice}</p> : null}
      {error ? <p style={{ fontSize: 13, color: "#b00020" }}>{error}</p> : null}
      {suggestions.length > 0 ? (
        <ul style={{ marginTop: 8, paddingLeft: 18 }}>
          {suggestions.map((s, i) => (
            <li key={i} style={{ marginBottom: 10 }}>
              <p style={{ whiteSpace: "pre-wrap", margin: "0 0 6px" }}>{s}</p>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Aplicar esta sugestão no campo? Você poderá editar depois.")) {
                    onApplySuggestion(s);
                    setSuggestions([]);
                    setNotice("Sugestão aplicada no campo. Salve o perfil para gravar.");
                  }
                }}
              >
                Usar esta versão
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
