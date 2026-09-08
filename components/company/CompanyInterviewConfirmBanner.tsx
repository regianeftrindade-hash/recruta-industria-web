"use client";

import React, { useCallback, useEffect, useState } from "react";
import { DASH, dashCard } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  confirmed: boolean;
  createdAt: string;
};

type Props = {
  onOpenEntrevistas: () => void;
};

/** Faixa no topo do painel quando o profissional confirma/recusa a entrevista. */
export default function CompanyInterviewConfirmBanner({ onOpenEntrevistas }: Props) {
  const [items, setItems] = useState<Notif[]>([]);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/company/notifications?unread=1", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { notifications?: Notif[] };
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void carregar();
    const id = window.setInterval(() => void carregar(), 25_000);
    return () => window.clearInterval(id);
  }, [carregar]);

  if (items.length === 0) return null;

  const marcarLidos = async () => {
    const ids = items.map((i) => i.id);
    setItems([]);
    try {
      await fetch("/api/company/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      });
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="status"
      style={{
        ...dashCard,
        margin: "12px 16px 0",
        padding: "12px 14px",
        borderColor: "rgba(200,155,60,0.55)",
        background: "rgba(200,155,60,0.12)",
      }}
    >
      <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: DASH.gold }}>
        Resposta do profissional
      </p>
      <ul style={{ margin: "0 0 10px", paddingLeft: 18, color: DASH.text, fontSize: 12, lineHeight: 1.45 }}>
        {items.slice(0, 5).map((n) => (
          <li key={n.id} style={{ marginBottom: 4 }}>
            <strong style={{ color: n.confirmed ? "#8bc34a" : "#e57373" }}>
              {n.confirmed ? "Confirmou" : "Recusou"}
            </strong>
            {" — "}
            {n.body || n.title}
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            void marcarLidos();
            onOpenEntrevistas();
          }}
          style={{ ...btnGold, padding: "7px 12px", fontSize: 11 }}
        >
          Ver entrevistas
        </button>
        <button
          type="button"
          onClick={() => void marcarLidos()}
          style={{
            background: "transparent",
            border: `1px solid ${DASH.border}`,
            color: DASH.muted,
            borderRadius: 8,
            padding: "7px 12px",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Dispensar
        </button>
      </div>
    </div>
  );
}
