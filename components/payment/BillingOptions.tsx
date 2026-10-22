"use client";

import React from "react";
import type { BillingMode, BillingPeriod } from "@/lib/billing";
import { billingModeLabel, billingPeriodLabel } from "@/lib/billing";
import { BUTTON_3D_GOLD_SHADOW, BUTTON_3D_GOLD_SHADOW_ACTIVE, goldButton3DStyle } from "@/lib/button-3d";

type BillingOptionsProps = {
  billingPeriod: BillingPeriod;
  billingMode: BillingMode;
  onPeriodChange: (period: BillingPeriod) => void;
  onModeChange: (mode: BillingMode) => void;
  /** Se false, esconde assinatura recorrente (Asaas só tem Pix/Boleto único). */
  recurringSupported?: boolean;
};

/** Selecionado = afundado/escuro; não selecionado = relevo claro. */
const optionStyle = (active: boolean): React.CSSProperties => ({
  ...goldButton3DStyle,
  flex: 1,
  padding: "12px 10px",
  fontSize: 13,
  fontWeight: 700,
  textAlign: "center",
  lineHeight: 1.35,
  outline: "none",
  cursor: "pointer",
  color: "#414141",
  border: "2px solid #8D6B1F",
  borderRadius: 12,
  background: active ? "#D4AF37" : "#E8C56A",
  boxShadow: active ? BUTTON_3D_GOLD_SHADOW_ACTIVE : BUTTON_3D_GOLD_SHADOW,
  transform: active ? "translateY(1px)" : "none",
});

export function BillingOptions({
  billingPeriod,
  billingMode,
  onPeriodChange,
  onModeChange,
  recurringSupported = true,
}: BillingOptionsProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ color: "#aaa", fontSize: 12, margin: "0 0 8px", fontWeight: 600 }}>
        1. Periodicidade
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["monthly", "annual"] as const).map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => onPeriodChange(period)}
            aria-pressed={billingPeriod === period}
            style={optionStyle(billingPeriod === period)}
          >
            {billingPeriodLabel(period)}
          </button>
        ))}
      </div>

      {recurringSupported ? (
        <>
          <p style={{ color: "#aaa", fontSize: 12, margin: "0 0 8px", fontWeight: 600 }}>
            2. Forma de cobrança
          </p>
          <div style={{ display: "flex", gap: 8, flexDirection: "column", marginBottom: 4 }}>
            {(["one_time", "recurring"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onModeChange(mode)}
                aria-pressed={billingMode === mode}
                style={{ ...optionStyle(billingMode === mode), flex: "none", width: "100%" }}
              >
                {billingModeLabel(mode)}
              </button>
            ))}
          </div>
          {billingMode === "recurring" && (
            <p style={{ color: "#8D6B1F", fontSize: 11, margin: "10px 0 0", lineHeight: 1.5 }}>
              Renovação automática via PagBank (boleto). Cada cobrança chega no e-mail cadastrado.
            </p>
          )}
        </>
      ) : (
        <p style={{ color: "#8D6B1F", fontSize: 11, margin: "0 0 4px", lineHeight: 1.5 }}>
          Pagamento único via Pix ou Boleto.
        </p>
      )}

      {billingPeriod === "annual" && billingMode === "one_time" && (
        <p style={{ color: "#8D6B1F", fontSize: 11, margin: "10px 0 0", lineHeight: 1.5 }}>
          Plano anual com 2 meses de desconto — pagamento único.
        </p>
      )}
    </div>
  );
}
