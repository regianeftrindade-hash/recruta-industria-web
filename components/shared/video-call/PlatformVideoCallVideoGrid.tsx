"use client";

import type { RefObject } from "react";
import { DASH } from "@/lib/dashboard-theme";
import type { CallStatus } from "./types";

type Props = {
  overlayPip: boolean;
  localRef: RefObject<HTMLVideoElement | null>;
  remoteRef: RefObject<HTMLVideoElement | null>;
  cameraOn: boolean;
  remoteLive: boolean;
  status: CallStatus;
  peerLabel: string;
};

/** Grade local + remoto (ou PIP compacto). */
export default function PlatformVideoCallVideoGrid({
  overlayPip,
  localRef,
  remoteRef,
  cameraOn,
  remoteLive,
  status,
  peerLabel,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: overlayPip ? "1fr" : "1fr 1fr",
        gap: overlayPip ? 4 : 8,
        marginBottom: overlayPip ? 6 : 10,
      }}
    >
      <div
        style={{
          aspectRatio: overlayPip ? "1 / 1" : "4 / 3",
          maxHeight: overlayPip ? 72 : undefined,
          borderRadius: overlayPip ? 8 : 10,
          overflow: "hidden",
          border: `1px solid ${DASH.gold}`,
          background: "#0a0a0a",
          position: "relative",
        }}
      >
        <video
          ref={localRef}
          muted
          playsInline
          autoPlay
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: cameraOn ? "block" : "none",
          }}
        />
        {!cameraOn && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: DASH.muted,
              fontSize: 11,
              textAlign: "center",
              padding: 8,
            }}
          >
            {status === "accepted" ? "Abrindo câmera…" : "Câmera off"}
          </div>
        )}
        {!overlayPip && (
          <span
            style={{
              position: "absolute",
              left: 6,
              bottom: 6,
              fontSize: 9,
              fontWeight: 700,
              background: "rgba(0,0,0,0.65)",
              color: DASH.gold,
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            Você
          </span>
        )}
      </div>

      <div
        style={{
          aspectRatio: overlayPip ? "1 / 1" : "4 / 3",
          maxHeight: overlayPip ? 72 : undefined,
          borderRadius: overlayPip ? 8 : 10,
          overflow: "hidden",
          border: `1px solid ${DASH.gold}`,
          background: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          color: DASH.muted,
          fontSize: overlayPip ? 9 : 11,
          textAlign: "center",
          padding: 0,
        }}
      >
        <video
          ref={remoteRef}
          playsInline
          autoPlay
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: remoteLive ? "block" : "none",
          }}
        />
        {!remoteLive && (
          <div style={{ padding: 8 }}>
            {status === "accepted"
              ? "Conectando o vídeo da outra pessoa…"
              : `Aguardando ${peerLabel}…`}
          </div>
        )}
        {!overlayPip && (
          <span
            style={{
              position: "absolute",
              left: 6,
              bottom: 6,
              fontSize: 9,
              fontWeight: 700,
              background: "rgba(0,0,0,0.65)",
              color: DASH.gold,
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            {peerLabel}
          </span>
        )}
      </div>
    </div>
  );
}
