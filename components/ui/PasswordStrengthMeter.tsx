"use client";

import React from "react";
import { calculatePasswordScore } from "@/lib/security";
import { t } from "@/lib/i18n/translate";

interface PasswordStrengthMeterProps {
  password: string;
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { percentage, crackTime, feedback } = calculatePasswordScore(password);

  const getColor = () => {
    if (percentage < 30) return "#ef4444";
    if (percentage < 50) return "#f59e0b";
    if (percentage < 70) return "#eab308";
    if (percentage < 85) return "#84cc16";
    return "#10b981";
  };

  const getLabel = () => {
    if (percentage < 30) return t("rest.password.veryWeak");
    if (percentage < 50) return t("rest.password.weak");
    if (percentage < 70) return t("rest.password.medium");
    if (percentage < 85) return t("rest.password.strong");
    return t("rest.password.veryStrong");
  };

  const color = getColor();

  return (
    <div style={{ marginTop: "12px" }} aria-live="polite">
      <div
        style={{
          width: "100%",
          height: "8px",
          backgroundColor: "#e5e7eb",
          borderRadius: "4px",
          overflow: "hidden",
          marginBottom: "8px",
        }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={getLabel()}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: color,
            transition: "all 0.3s ease",
            borderRadius: "4px",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: "bold", color }}>
          {getLabel()} ({percentage}%)
        </span>
        <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600" }}>
          {t("rest.password.crackTime")} {crackTime}
        </span>
      </div>

      {feedback.length > 0 && (
        <div
          style={{
            backgroundColor: "#f3f4f6",
            padding: "10px",
            borderRadius: "8px",
            marginTop: "10px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            {t("rest.password.suggestions")}
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: "20px",
              fontSize: "11px",
              color: "#6b7280",
            }}
          >
            {feedback.map((item, index) => (
              <li key={index} style={{ marginBottom: "3px" }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        {(
          [
            [password.length >= 8, t("rest.password.ruleLength")],
            [/[A-Z]/.test(password), t("rest.password.ruleUpper")],
            [/[0-9]/.test(password), t("rest.password.ruleNumber")],
            [/[!@#$%^&*(),.?":{}|<>]/.test(password), t("rest.password.ruleSymbol")],
          ] as const
        ).map(([ok, label]) => (
          <div
            key={label}
            style={{
              fontSize: "11px",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: ok ? "#d1fae5" : "#fee2e2",
              color: ok ? "#065f46" : "#991b1b",
              fontWeight: "600",
            }}
          >
            {ok ? "✓" : "✗"} {label}
          </div>
        ))}
      </div>
    </div>
  );
}
