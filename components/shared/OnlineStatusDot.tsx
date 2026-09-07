"use client";

import type { CSSProperties } from "react";

type Props = {
  online: boolean;
  size?: number;
  title?: string;
  style?: CSSProperties;
};

/** Bolinha verde (online) ou transparente com contorno (offline). */
export default function OnlineStatusDot({
  online,
  size = 12,
  title,
  style,
}: Props) {
  return (
    <span
      title={title || (online ? "Online" : "Offline")}
      aria-label={online ? "Online" : "Offline"}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: online ? "#22c55e" : "transparent",
        border: online ? "1px solid #16a34a" : "1px solid rgba(200,155,60,0.55)",
        boxShadow: online ? "0 0 0 2px rgba(34,197,94,0.25)" : "none",
        ...style,
      }}
    />
  );
}
