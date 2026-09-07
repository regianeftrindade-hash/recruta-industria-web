"use client";

import React from "react";
import type { BillingMode, BillingPeriod } from "@/lib/billing";
import { billingModeLabel, billingPeriodLabel } from "@/lib/billing";
import { goldButton3DMutedStyle, goldButton3DStyle } from "@/lib/button-3d";

type BillingOptionsProps = {
  billingPeriod: BillingPeriod;
  billingMode: BillingMode;
  onPeriodChange: (period: BillingPeriod) => void;
  onModeChange: (mode: BillingMode) => void;
};

const optionStyle = (active: boolean): React.CSSProperties => ({
  ...(active ? goldButton3DStyle : goldButton3DMutedStyle),
  flex: 1,
  padding: 10,
  borderRadius: 6,
  fontSize: 11,
  textAlign: "center",
  lineHeight: 1.35,
});

export function BillingOptions({
  billingPeriod,
  billingMode,
  onPeriodChange,
  onModeChange,
}: BillingOptionsProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ color: "#aaa", fontSize: 11, margin: "0 0 8px", fontWeight: 600 }}>
        Periodicidade
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {(["monthly", "annual"] as const).map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => onPeriodChange(period)}
            style={optionStyle(billingPeriod === period)}
          >
            {billingPeriodLabel(period)}
          </button>
        ))}
      </div>

      <p style={{ color: "#aaa", fontSize: 11, margin: "0 0 8px", fontWeight: 600 }}>
        Forma de cobrança
      </p>
      <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
        {(["recurring", "one_time"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onModeChange(mode)}
            style={{ ...optionStyle(billingMode === mode), flex: "none", width: "100%" }}
          >
            {billingModeLabel(mode)}
          </button>
        ))}
      </div>

      {billingMode === "recurring" && (
        <p style={{ color: "#8D6B1F", fontSize: 10, margin: "10px 0 0", lineHeight: 1.5 }}>
          A renovação é automática via PagBank (boleto recorrente). Você receberá cada cobrança no e-mail cadastrado.
        </p>
      )}
      {billingPeriod === "annual" && billingMode === "one_time" && (
        <p style={{ color: "#8D6B1F", fontSize: 10, margin: "10px 0 0", lineHeight: 1.5 }}>
          Plano anual com 2 meses de desconto — pagamento único via Pix ou Boleto.
        </p>
      )}
    </div>
  );
}
