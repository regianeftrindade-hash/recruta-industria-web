"use client";

import React from "react";
import { DASH } from "@/lib/dashboard-theme";

type Props = {
  active: boolean;
  onChange: () => void;
  disabled?: boolean;
  label?: string;
};

/** Seletor ON/OFF deslizante — clique alterna o lado. */
export default function AnonymousModeToggle({
  active,
  onChange,
  disabled = false,
  label = "Modo anônimo",
}: Props) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
      title={
        active
          ? "Modo anônimo ativo: profissionais não veem o nome da empresa"
          : "Ativar modo anônimo: navegue sem revelar o nome da empresa"
      }
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: DASH.gold,
          whiteSpace: "nowrap",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
        }}
      >
        🕶️ {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={`${label}: ${active ? "ligado" : "desligado"}`}
        disabled={disabled}
        onClick={onChange}
        style={{
          position: "relative",
          width: 64,
          height: 28,
          borderRadius: 999,
          border: `1px solid ${DASH.gold}`,
          padding: 0,
          cursor: disabled ? "wait" : "pointer",
          opacity: disabled ? 0.7 : 1,
          background: active
            ? "linear-gradient(90deg, #8d6b1f 0%, #c89b3c 55%, #e2c66c 100%)"
            : "rgba(0,0,0,0.35)",
          boxShadow: active
            ? "inset 0 1px 0 rgba(255,228,150,0.35)"
            : "inset 0 1px 3px rgba(0,0,0,0.45)",
          transition: "background 0.22s ease",
          flexShrink: 0,
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 7,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 8,
            fontWeight: 800,
            color: active ? "transparent" : DASH.muted,
            letterSpacing: "0.04em",
            pointerEvents: "none",
            transition: "color 0.2s ease",
          }}
        >
          OFF
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 8,
            fontWeight: 800,
            color: active ? "#1a1208" : "transparent",
            letterSpacing: "0.04em",
            pointerEvents: "none",
            transition: "color 0.2s ease",
          }}
        >
          ON
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 2,
            left: active ? 36 : 2,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: active
              ? "linear-gradient(160deg, #fff6d6 0%, #f0d78a 100%)"
              : "linear-gradient(160deg, #ddd 0%, #999 100%)",
            border: "1px solid #5a4512",
            boxShadow: "0 2px 4px rgba(0,0,0,0.35)",
            transition: "left 0.22s ease",
          }}
        />
      </button>
    </div>
  );
}
