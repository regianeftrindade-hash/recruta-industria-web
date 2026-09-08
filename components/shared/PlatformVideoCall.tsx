"use client";

import React, { useEffect, useRef, useState } from "react";
import { DASH, dashCard, dashSectionTitle } from "@/lib/dashboard-theme";
import styles from "./PlatformVideoCall.module.css";
import type { PlatformVideoCallProps } from "./video-call/types";
import { getCallStatusLabel } from "./video-call/statusLabel";
import { usePlatformVideoCallCamera } from "./video-call/usePlatformVideoCallCamera";
import { usePlatformVideoCallWebRtc } from "./video-call/usePlatformVideoCallWebRtc";
import { usePlatformVideoCall } from "./video-call/usePlatformVideoCall";
import PlatformVideoCallChromeControls from "./video-call/PlatformVideoCallChromeControls";
import PlatformVideoCallVideoGrid from "./video-call/PlatformVideoCallVideoGrid";
import PlatformVideoCallInvitePanel from "./video-call/PlatformVideoCallInvitePanel";
import PlatformVideoCallActionBar from "./video-call/PlatformVideoCallActionBar";

/**
 * Chamada pela plataforma:
 * - Empresa clica em Chamar → profissional vê "Chamando" + Aceitar
 * - Câmera só liga depois que o profissional aceita
 */
export default function PlatformVideoCall({
  role,
  profileId,
  title = "Chamada de vídeo",
  compact = false,
  peerLabel = "Outro participante",
}: PlatformVideoCallProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [overlay, setOverlay] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [remoteLive, setRemoteLive] = useState(false);
  const [error, setError] = useState("");

  const { startCamera, stopCamera } = usePlatformVideoCallCamera({
    localRef,
    streamRef,
    cameraOn,
    setCameraOn,
    setError,
  });

  const call = usePlatformVideoCall({
    role,
    profileId,
    stopCamera,
    startCamera,
    cameraOn,
    overlay,
    setOverlay,
    setMinimized,
    setError,
  });

  usePlatformVideoCallWebRtc({
    status: call.status,
    callId: call.callId,
    cameraOn,
    role,
    isInitiator: call.isInitiator,
    streamRef,
    remoteRef,
    setRemoteLive,
  });

  // Reanexa o stream local quando o painel remonta (overlay / minimize / status)
  useEffect(() => {
    if (cameraOn && localRef.current && streamRef.current) {
      localRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn, overlay, minimized, call.status]);

  const overlayPip = overlay;

  const enableOverlay = () => {
    call.pinAsOverlay();
  };

  const toggleOverlay = () => {
    if (overlay) call.disableOverlay();
    else enableOverlay();
  };

  const panelBase: React.CSSProperties = {
    ...dashCard,
    border: `1px solid ${DASH.gold}`,
    borderRadius: overlayPip ? 12 : 16,
    overflow: "hidden",
    padding: overlayPip ? 4 : compact ? 12 : 14,
    background: DASH.card,
    boxSizing: "border-box",
  };

  const panelStyle: React.CSSProperties = overlay
    ? panelBase
    : {
        ...panelBase,
        width: "100%",
        maxWidth: compact ? 280 : "100%",
        minWidth: 0,
      };

  const statusLabel = getCallStatusLabel(call.status, role, call.isInitiator, call.incomingCompany);

  const panel = (
    <section
      ref={panelRef as React.RefObject<HTMLElement>}
      className={overlay ? `dash-card ${styles.pip}` : "dash-card"}
      style={panelStyle}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: overlayPip ? "flex-end" : "space-between",
          gap: 8,
          marginBottom: overlayPip ? 4 : 10,
          flexWrap: "wrap",
        }}
      >
        {!overlayPip && (
          <h3 style={{ ...dashSectionTitle, color: DASH.gold, margin: 0, fontSize: compact ? 13 : 14 }}>
            📹 {title}
          </h3>
        )}
        <PlatformVideoCallChromeControls
          overlay={overlay}
          overlayPip={overlayPip}
          minimized={minimized}
          onToggleOverlay={toggleOverlay}
          onToggleMinimized={() => setMinimized((v) => !v)}
        />
      </div>

      {!overlayPip && (
        <p
          style={{
            margin: "0 0 10px",
            fontSize: 12,
            fontWeight: 700,
            color: call.status === "ringing" || call.status === "team_invite" ? "#22c55e" : DASH.gold,
          }}
        >
          {statusLabel}
        </p>
      )}

      {!(overlay && minimized) && (
        <PlatformVideoCallVideoGrid
          overlayPip={overlayPip}
          localRef={localRef}
          remoteRef={remoteRef}
          cameraOn={cameraOn}
          remoteLive={remoteLive}
          status={call.status}
          peerLabel={peerLabel}
        />
      )}

      {!overlayPip && role === "company" && (
        <PlatformVideoCallInvitePanel
          status={call.status}
          isInitiator={call.isInitiator}
          extrasCount={call.extrasCount}
          podeConvidarMais={call.podeConvidarMais}
          pendingInvites={call.pendingInvites}
          participants={call.participants}
          addingParticipant={call.addingParticipant}
          loadingRhMembers={call.loadingRhMembers}
          showRhMembers={call.showRhMembers}
          rhMembers={call.rhMembers}
          onRemovePendingInvite={(id) =>
            call.setPendingInvites((prev) => prev.filter((p) => p.id !== id))
          }
          onRemoveParticipant={(id) => void call.handleRemoveParticipant(id)}
          onLoadRhMembers={() => void call.loadRhMembers()}
          onInviteMember={(member) => void call.handleInviteMember(member)}
        />
      )}

      {!overlayPip &&
        role === "company" &&
        !call.isInitiator &&
        (call.status === "ringing" || call.status === "accepted") &&
        call.participants.length > 0 && (
          <div
            style={{
              border: `1px solid ${DASH.gold}`,
              borderRadius: 8,
              padding: 8,
              marginBottom: 10,
            }}
          >
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 10,
                fontWeight: 700,
                color: DASH.gold,
                textTransform: "uppercase",
              }}
            >
              Participantes ({call.participants.length})
            </p>
            {call.participants.map((part) => (
              <p key={part.id} style={{ margin: "2px 0", fontSize: 11, color: DASH.text }}>
                👤 {part.name}
              </p>
            ))}
          </div>
        )}

      {overlayPip && !minimized && (
        <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 700, color: DASH.gold }}>
          {call.status === "accepted" ? "Chamada" : statusLabel}
        </p>
      )}
      {error && !overlayPip && (
        <p style={{ margin: "0 0 8px", fontSize: overlayPip ? 9 : 11, color: "#f87171", lineHeight: 1.4 }}>
          {error}
        </p>
      )}

      {!overlayPip && (
        <PlatformVideoCallActionBar
          role={role}
          status={call.status}
          isInitiator={call.isInitiator}
          busy={call.busy}
          profileId={profileId}
          overlayPip={overlayPip}
          onChamar={() => void call.handleChamar()}
          onTeamAccept={() => void call.handleTeamAccept()}
          onTeamDecline={() => void call.handleTeamDecline()}
          onAccept={() => void call.handleAccept()}
          onDecline={() => void call.handleDecline()}
          onEnd={() => void call.handleEnd()}
          onResetIdle={call.resetIdle}
        />
      )}

      {overlayPip && call.status === "accepted" && !minimized && (
        <button
          type="button"
          onClick={() => void call.handleEnd()}
          style={{
            background: "transparent",
            border: "1px solid #dc3545",
            color: "#f87171",
            borderRadius: 6,
            padding: "3px 4px",
            fontSize: 8,
            cursor: "pointer",
            width: "100%",
          }}
        >
          Encerrar
        </button>
      )}

      {!overlayPip && !compact && (
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 10,
            color: DASH.muted,
            lineHeight: 1.4,
            overflowWrap: "anywhere",
          }}
        >
          {role === "company"
            ? "Clique em Chamar. A câmera só liga quando o profissional aceitar. Use Sobrepor para rolar a página com o vídeo fixo."
            : "Quando a empresa ligar, use Aceitar ou Recusar. Use Sobrepor para rolar a página com o vídeo fixo."}
        </p>
      )}
    </section>
  );

  return <div ref={wrapRef}>{panel}</div>;
}
