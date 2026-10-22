"use client";

import { DASH } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";

type Props = {
  overlay: boolean;
  overlayPip: boolean;
  minimized: boolean;
  onToggleOverlay: () => void;
  onToggleMinimized: () => void;
};

/** Botões Sobrepor / minimizar do PIP. */
export default function PlatformVideoCallChromeControls({
  overlay,
  overlayPip,
  minimized,
  onToggleOverlay,
  onToggleMinimized,
}: Props) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={onToggleOverlay}
        style={{
          ...btnGold,
          padding: overlayPip ? "4px 8px" : "5px 10px",
          fontSize: overlayPip ? 9 : 10,
          background: "#E8C56A",
          color: "#000",
          border: "2px solid #8D6B1F",
          borderRadius: 14,
        }}
        title="Mantém o vídeo no lugar enquanto você rola a página"
      >
        {overlay ? (overlayPip ? "Fixo" : "Fixo ✓") : "Sobrepor"}
      </button>
      {overlay && (
        <button
          type="button"
          onClick={onToggleMinimized}
          style={{
            background: "transparent",
            border: `2px solid #8D6B1F`,
            color: DASH.gold,
            borderRadius: 8,
            padding: overlayPip ? "4px 6px" : "5px 8px",
            fontSize: overlayPip ? 9 : 10,
            cursor: "pointer",
          }}
        >
          {minimized ? "+" : "−"}
        </button>
      )}
    </div>
  );
}
