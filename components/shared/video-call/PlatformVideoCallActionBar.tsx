"use client";

import { DASH } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import type { CallStatus } from "./types";

type Props = {
  role: "company" | "professional";
  status: CallStatus;
  isInitiator: boolean;
  busy: boolean;
  profileId?: string;
  overlayPip: boolean;
  onChamar: () => void;
  onTeamAccept: () => void;
  onTeamDecline: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
  onResetIdle: () => void;
};

/** Barra de ações: Chamar / Aceitar / Recusar / Encerrar / etc. */
export default function PlatformVideoCallActionBar({
  role,
  status,
  isInitiator,
  busy,
  profileId,
  overlayPip,
  onChamar,
  onTeamAccept,
  onTeamDecline,
  onAccept,
  onDecline,
  onEnd,
  onResetIdle,
}: Props) {
  return (
    <div style={{ display: "flex", gap: overlayPip ? 4 : 8, flexWrap: "wrap" }}>
      {role === "company" && status === "idle" && (
        <button
          type="button"
          disabled={busy || !profileId}
          onClick={onChamar}
          style={{ ...btnGold, padding: "8px 12px", fontSize: 12, flex: 1, opacity: busy ? 0.7 : 1 }}
        >
          {busy ? "Chamando…" : "Chamar"}
        </button>
      )}

      {role === "company" && status === "team_invite" && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={onTeamAccept}
            style={{ ...btnGold, padding: "8px 12px", fontSize: 12, flex: 1, opacity: busy ? 0.7 : 1 }}
          >
            Aceitar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onTeamDecline}
            style={{
              background: "transparent",
              border: `1px solid #dc3545`,
              color: "#f87171",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              cursor: "pointer",
              flex: 1,
            }}
          >
            Recusar
          </button>
        </>
      )}

      {role === "company" && status === "ringing" && isInitiator && (
        <button
          type="button"
          disabled={busy}
          onClick={onEnd}
          style={{
            background: "transparent",
            border: `1px solid ${DASH.gold}`,
            color: DASH.gold,
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            cursor: "pointer",
            flex: 1,
          }}
        >
          Cancelar
        </button>
      )}

      {role === "company" && status === "ringing" && !isInitiator && (
        <button
          type="button"
          disabled={busy}
          onClick={onEnd}
          style={{
            background: "transparent",
            border: `1px solid ${DASH.gold}`,
            color: DASH.gold,
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            cursor: "pointer",
            flex: 1,
          }}
        >
          Sair
        </button>
      )}

      {role === "professional" && status === "ringing" && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={onAccept}
            style={{ ...btnGold, padding: "8px 12px", fontSize: 12, flex: 1, opacity: busy ? 0.7 : 1 }}
          >
            Aceitar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDecline}
            style={{
              background: "transparent",
              border: `1px solid #dc3545`,
              color: "#f87171",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              cursor: "pointer",
              flex: 1,
            }}
          >
            Recusar
          </button>
        </>
      )}

      {status === "accepted" && (
        <button
          type="button"
          onClick={onEnd}
          style={{
            background: "transparent",
            border: `1px solid #dc3545`,
            color: "#f87171",
            borderRadius: 8,
            padding: overlayPip ? "4px 6px" : "8px 12px",
            fontSize: overlayPip ? 9 : 12,
            cursor: "pointer",
            flex: 1,
          }}
        >
          Encerrar
        </button>
      )}

      {(status === "declined" || status === "missed" || status === "ended") && (
        <button
          type="button"
          onClick={onResetIdle}
          style={{ ...btnGold, padding: "8px 12px", fontSize: 12, flex: 1 }}
        >
          {role === "company" ? "Nova chamada" : "Ok"}
        </button>
      )}
    </div>
  );
}
