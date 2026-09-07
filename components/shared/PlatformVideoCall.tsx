"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CALL_RTC_CONFIG } from "@/lib/video-call-peer";
import { DASH, dashCard, dashSectionTitle } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import styles from "./PlatformVideoCall.module.css";

type CallStatus = "idle" | "ringing" | "team_invite" | "accepted" | "declined" | "ended" | "missed";

type Props = {
  /** company: botão Chamar | professional: escuta chamadas entrantes */
  role: "company" | "professional";
  /** Obrigatório no papel company */
  profileId?: string;
  title?: string;
  compact?: boolean;
  peerLabel?: string;
};

type ApiCall = {
  id: string;
  profileId: string;
  companyUserId: string;
  companyName: string;
  status: string;
};

type Participant = {
  id: string;
  name: string;
};

type RhMember = {
  id: string;
  name: string;
  email: string;
  department: string;
};

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
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const seenSignalsRef = useRef<Set<string>>(new Set());
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);

  const [overlay, setOverlay] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const [callId, setCallId] = useState<string | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [incomingCompany, setIncomingCompany] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [remoteLive, setRemoteLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [rhMembers, setRhMembers] = useState<RhMember[]>([]);
  const [loadingRhMembers, setLoadingRhMembers] = useState(false);
  const [showRhMembers, setShowRhMembers] = useState(false);
  /** Até 3 convidados do RH (além de você) — pode escolher antes ou durante a chamada. */
  const [pendingInvites, setPendingInvites] = useState<RhMember[]>([]);
  /** Quem iniciou a chamada (demais colegas entram via aceitar/recusar). */
  const [isInitiator, setIsInitiator] = useState(false);
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (localRef.current) localRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError("");
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Este navegador não permite acesso à câmera. Use Chrome/Edge em http://localhost.");
      return;
    }
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
      }
      streamRef.current = stream;
      if (localRef.current) {
        localRef.current.srcObject = stream;
        await localRef.current.play().catch(() => {});
      }
      setCameraOn(true);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError(
          "Permissão negada. Clique no cadeado ao lado da URL → Câmera/Microfone → Permitir, e tente de novo.",
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("Nenhuma câmera encontrada neste computador.");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setError("A câmera está em uso por outro aplicativo. Feche-o e tente de novo.");
      } else {
        setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (cameraOn && localRef.current && streamRef.current) {
      localRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn, overlay, minimized, status]);

  // Empresa: colegas do mesmo plano com o mesmo perfil aberto recebem convite
  useEffect(() => {
    if (role !== "company" || !profileId) return;
    if (status === "declined" || status === "ended" || status === "missed") return;
    if (isInitiator && callId && (status === "ringing" || status === "accepted")) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/calls/team?profileId=${encodeURIComponent(profileId)}`, {
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const call = data.call as ApiCall | null;
        const participantsList = Array.isArray(data.participants) ? data.participants : [];

        if (!call) {
          if (!isInitiator && status === "team_invite") {
            setStatus("idle");
            setCallId(null);
            setIncomingCompany("");
          }
          return;
        }

        if (data.isInitiator) {
          setIsInitiator(true);
          setCallId(call.id);
          if (Array.isArray(participantsList)) setParticipants(participantsList);
          if (call.status === "ACCEPTED") setStatus("accepted");
          else if (call.status === "RINGING") setStatus("ringing");
          else if (call.status === "ENDED" || call.status === "MISSED") {
            setStatus(call.status === "MISSED" ? "missed" : "ended");
            stopCamera();
          }
          return;
        }

        setIsInitiator(false);
        if (data.teamStatus === "pending") {
          setCallId(call.id);
          setIncomingCompany(String(data.initiatorName || "Colega"));
          setStatus("team_invite");
        } else if (data.teamStatus === "accepted") {
          setCallId(call.id);
          if (participantsList.length) setParticipants(participantsList);
          setStatus(call.status === "ACCEPTED" ? "accepted" : "ringing");
        }
      } catch {
        /* ignore */
      }
    };

    void poll();
    const id = window.setInterval(poll, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [role, profileId, status, callId, isInitiator, stopCamera]);

  const pinAsOverlay = () => {
    setOverlay(true);
    setMinimized(false);
  };

  // Convite da equipe: abre sobreposição automaticamente
  useEffect(() => {
    if (role !== "company" || status !== "team_invite" || overlay) return;
    pinAsOverlay();
  }, [role, status, overlay]);

  // Empresa: poll status da chamada ativa (iniciador ou quem já entrou na equipe)
  useEffect(() => {
    if (role !== "company" || !callId) return;
    if (status !== "ringing" && status !== "accepted") return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/calls/${callId}`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const call = data.call as ApiCall | undefined;
        if (!call || cancelled) return;
        if (Array.isArray(data.participants)) setParticipants(data.participants);
        if (call.status === "ACCEPTED") {
          setStatus("accepted");
        } else if (call.status === "DECLINED") {
          setStatus("declined");
          stopCamera();
        } else if (call.status === "ENDED" || call.status === "MISSED") {
          setStatus(call.status === "MISSED" ? "missed" : "ended");
          stopCamera();
        }
      } catch {
        /* ignore */
      }
    };
    void poll();
    const id = window.setInterval(poll, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [role, callId, status, stopCamera]);

  // Profissional: poll status quando já aceitou (para detectar encerramento)
  useEffect(() => {
    if (role !== "professional" || !callId) return;
    if (status !== "accepted") return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/calls/${callId}`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const call = data.call as ApiCall | undefined;
        if (!call || cancelled) return;
        if (Array.isArray(data.participants)) setParticipants(data.participants);
        if (call.status === "ENDED" || call.status === "DECLINED" || call.status === "MISSED") {
          setStatus("ended");
          stopCamera();
        }
      } catch {
        /* ignore */
      }
    };
    void poll();
    const id = window.setInterval(poll, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [role, callId, status, stopCamera]);

  // Quando aceita (dos dois lados), liga a câmera
  useEffect(() => {
    if (status === "accepted" && !cameraOn) {
      void startCamera();
    }
  }, [status, cameraOn, startCamera]);

  // Troca o vídeo remoto via WebRTC (a câmera local sozinha não chega no outro)
  useEffect(() => {
    if (status !== "accepted" || !callId || !cameraOn || !streamRef.current) return;

    let cancelled = false;
    const isOfferer = role === "company" && isInitiator;
    const localStream = streamRef.current;
    const pc = new RTCPeerConnection(CALL_RTC_CONFIG);
    pcRef.current = pc;
    seenSignalsRef.current = new Set();
    iceQueueRef.current = [];
    setRemoteLive(false);

    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    const attachRemote = (stream: MediaStream) => {
      if (!remoteRef.current) return;
      remoteRef.current.srcObject = stream;
      void remoteRef.current.play().catch(() => {});
      setRemoteLive(true);
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) attachRemote(stream);
    };

    const postSignal = async (type: "offer" | "answer" | "ice", payload: unknown) => {
      if (cancelled) return;
      try {
        await fetch(`/api/calls/${callId}/signal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ type, payload }),
        });
      } catch {
        /* ignore */
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        void postSignal("ice", event.candidate.toJSON());
      }
    };

    const flushIce = async () => {
      if (!pc.remoteDescription) return;
      const queued = iceQueueRef.current;
      iceQueueRef.current = [];
      for (const candidate of queued) {
        try {
          await pc.addIceCandidate(candidate);
        } catch {
          /* candidato tardio */
        }
      }
    };

    const processSignals = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/calls/${callId}/signal`, { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          signals?: Array<{ id: string; type: string; payload: string }>;
        };
        for (const signal of data.signals || []) {
          if (seenSignalsRef.current.has(signal.id)) continue;
          seenSignalsRef.current.add(signal.id);
          let payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
          try {
            payload = JSON.parse(signal.payload) as RTCSessionDescriptionInit | RTCIceCandidateInit;
          } catch {
            continue;
          }

          if (signal.type === "ice") {
            const ice = payload as RTCIceCandidateInit;
            if (!pc.remoteDescription) {
              iceQueueRef.current.push(ice);
            } else {
              try {
                await pc.addIceCandidate(ice);
              } catch {
                /* ignore */
              }
            }
            continue;
          }

          if (signal.type === "offer" && !isOfferer) {
            await pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
            await flushIce();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await postSignal("answer", answer);
          }

          if (signal.type === "answer" && isOfferer && pc.signalingState !== "stable") {
            await pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
            await flushIce();
          }
        }
      } catch {
        /* ignore */
      }
    };

    const start = async () => {
      if (isOfferer) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await postSignal("offer", offer);
      }
      await processSignals();
    };

    void start();
    const timer = window.setInterval(() => {
      void processSignals();
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.close();
      if (pcRef.current === pc) pcRef.current = null;
      if (remoteRef.current) remoteRef.current.srcObject = null;
      setRemoteLive(false);
    };
  }, [status, callId, cameraOn, role, isInitiator]);

  // Profissional: escuta chamadas entrantes
  useEffect(() => {
    if (role !== "professional") return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/calls", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const call = data.call as ApiCall | null;
        if (cancelled) return;
        if (call && call.status === "RINGING") {
          setCallId(call.id);
          setIncomingCompany(call.companyName || "Empresa");
          setStatus("ringing");
        } else if (status === "ringing" && !call) {
          // toque sumiu (expirou)
          setStatus("missed");
          setCallId(null);
        }
      } catch {
        /* ignore */
      }
    };

    void poll();
    const id = window.setInterval(poll, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [role, status]);

  const extrasCount =
    status === "idle" || status === "ended" || status === "declined" || status === "missed"
      ? pendingInvites.length
      : Math.max(0, participants.length - 1);
  const podeConvidarMais = extrasCount < 3;

  const handleChamar = async () => {
    if (!profileId) {
      setError("Perfil inválido para chamada.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível iniciar a chamada.");
        return;
      }
      const newCallId = String(data.call.id);
      setCallId(newCallId);
      setIsInitiator(true);
      setStatus("ringing");
      if (Array.isArray(data.participants)) setParticipants(data.participants);
    } catch {
      setError("Erro de rede ao iniciar a chamada.");
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async () => {
    if (!callId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/calls/${callId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "accept" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível aceitar.");
        return;
      }
      setStatus("accepted");
    } catch {
      setError("Erro de rede ao aceitar.");
    } finally {
      setBusy(false);
    }
  };

  const handleTeamAccept = async () => {
    if (!callId || !profileId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/calls/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ callId, profileId, action: "accept" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível entrar na chamada.");
        return;
      }
      if (Array.isArray(data.participants)) setParticipants(data.participants);
      const call = data.call as ApiCall | undefined;
      setStatus(call?.status === "ACCEPTED" ? "accepted" : "ringing");
    } catch {
      setError("Erro de rede ao entrar na chamada.");
    } finally {
      setBusy(false);
    }
  };

  const handleTeamDecline = async () => {
    if (!callId || !profileId) return;
    setBusy(true);
    try {
      await fetch("/api/calls/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ callId, profileId, action: "decline" }),
      });
      setStatus("declined");
      setCallId(null);
      setIncomingCompany("");
      disableOverlay();
    } catch {
      setError("Erro ao recusar.");
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    if (!callId) return;
    setBusy(true);
    try {
      await fetch(`/api/calls/${callId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "decline" }),
      });
      setStatus("declined");
      setCallId(null);
      stopCamera();
    } catch {
      setError("Erro ao recusar.");
    } finally {
      setBusy(false);
    }
  };

  const handleEnd = async () => {
    if (callId) {
      try {
        await fetch(`/api/calls/${callId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "end" }),
        });
      } catch {
        /* ignore */
      }
    }
    stopCamera();
    setCallId(null);
    setParticipants([]);
    setPendingInvites([]);
    setShowRhMembers(false);
    setIsInitiator(false);
    setStatus("idle");
    setIncomingCompany("");
  };

  const loadRhMembers = async () => {
    setShowRhMembers((current) => !current);
    if (rhMembers.length > 0) return;
    setLoadingRhMembers(true);
    setError("");
    try {
      const res = await fetch("/api/company/rh-members", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Não foi possível buscar pessoas da mesma assinatura.");
        return;
      }
      setRhMembers(Array.isArray(data.members) ? data.members : []);
    } catch {
      setError("Erro de rede ao buscar pessoas da mesma assinatura.");
    } finally {
      setLoadingRhMembers(false);
    }
  };

  const handleInviteMember = async (member: RhMember) => {
    if (!podeConvidarMais) {
      setError("Você já convidou o máximo de 3 pessoas.");
      return;
    }
    // Antes da chamada: guarda localmente (colegas verão o convite com o perfil aberto)
    if (!callId || status === "idle") {
      setPendingInvites((prev) => {
        if (prev.some((p) => p.id === member.id) || prev.length >= 3) return prev;
        return [...prev, member];
      });
      setError("");
      return;
    }
    if (status === "ringing" || status === "accepted") {
      setError("Colegas do mesmo plano verão o convite se estiverem com este perfil aberto.");
      return;
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!callId) return;
    try {
      const res = await fetch(`/api/calls/${callId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "remove-participant", participantId }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.participants)) setParticipants(data.participants);
    } catch {
      /* ignore */
    }
  };

  const enableOverlay = () => {
    pinAsOverlay();
  };

  const disableOverlay = () => {
    setOverlay(false);
    setMinimized(false);
  };

  const toggleOverlay = () => {
    if (overlay) disableOverlay();
    else enableOverlay();
  };

  const overlayPip = overlay;

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

  const statusLabel =
    status === "team_invite"
      ? `Convite — ${incomingCompany || "Colega"} quer entrevistar com você`
      : status === "ringing"
        ? role === "company"
          ? isInitiator
            ? "Chamando…"
            : "Aguardando candidato aceitar…"
          : `Chamando — ${incomingCompany || "Empresa"}`
        : status === "accepted"
          ? "Em chamada"
          : status === "declined"
            ? "Chamada recusada"
            : status === "missed"
              ? "Chamada perdida"
              : status === "ended"
                ? "Chamada encerrada"
                : "Aguardando";

  const controls = (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={toggleOverlay}
        style={{
          ...btnGold,
          padding: overlayPip ? "4px 6px" : "5px 8px",
          fontSize: overlayPip ? 9 : 10,
          background: overlay ? DASH.gold : "transparent",
          color: overlay ? "#000" : DASH.gold,
          border: `1px solid ${DASH.gold}`,
          boxShadow: overlay ? undefined : "none",
        }}
        title="Mantém o vídeo no lugar enquanto você rola a página"
      >
        {overlay ? (overlayPip ? "Fixo" : "Fixo ✓") : "Sobrepor"}
      </button>
      {overlay && (
        <button
          type="button"
          onClick={() => setMinimized((v) => !v)}
          style={{
            background: "transparent",
            border: `1px solid ${DASH.gold}`,
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
          {controls}
        </div>

        {!overlayPip && (
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 12,
              fontWeight: 700,
              color: status === "ringing" || status === "team_invite" ? "#22c55e" : DASH.gold,
            }}
          >
            {statusLabel}
          </p>
        )}

        {!(overlay && minimized) && (
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
        )}

        {!overlayPip && role === "company" && (isInitiator || status === "idle") && (
          <div
            style={{
              border: `1px solid ${DASH.gold}`,
              borderRadius: 8,
              padding: 8,
              marginBottom: 10,
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: 10, color: DASH.text, lineHeight: 1.45 }}>
              Colegas do mesmo plano podem entrar se estiverem com este perfil aberto — cada um aceita ou recusa no próprio painel.
            </p>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: DASH.gold, textTransform: "uppercase" }}>
              Convidados ({extrasCount}/3)
            </p>

            {status === "idle" || status === "ended" || status === "declined" || status === "missed"
              ? pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      color: DASH.text,
                      padding: "2px 0",
                    }}
                  >
                    <span>👤 {invite.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingInvites((prev) => prev.filter((p) => p.id !== invite.id))
                      }
                      style={{ background: "none", border: "none", color: "#f87171", fontSize: 10, cursor: "pointer", padding: 0 }}
                    >
                      Remover
                    </button>
                  </div>
                ))
              : participants.map((part, index) => (
                  <div
                    key={part.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      color: DASH.text,
                      padding: "2px 0",
                    }}
                  >
                    <span>👤 {part.name}</span>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => void handleRemoveParticipant(part.id)}
                        style={{ background: "none", border: "none", color: "#f87171", fontSize: 10, cursor: "pointer", padding: 0 }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}

            {podeConvidarMais && (
              <>
                <button
                  type="button"
                  disabled={addingParticipant || loadingRhMembers}
                  onClick={() => void loadRhMembers()}
                  style={{
                    ...btnGold,
                    width: "100%",
                    marginTop: 6,
                    padding: "6px 8px",
                    fontSize: 10,
                    opacity: addingParticipant || loadingRhMembers ? 0.7 : 1,
                  }}
                >
                  {loadingRhMembers ? "Buscando…" : "Convide"}
                </button>
                {showRhMembers && (
                  <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                    {rhMembers.length === 0 && !loadingRhMembers ? (
                      <p style={{ margin: 0, fontSize: 10, color: DASH.muted, lineHeight: 1.4 }}>
                        Nenhuma outra pessoa na mesma assinatura. Cadastre usuários na aba Equipe.
                      </p>
                    ) : (
                      rhMembers
                        .filter((member) => {
                          if (pendingInvites.some((p) => p.id === member.id)) return false;
                          if (participants.some((part) => part.name === member.name)) return false;
                          return true;
                        })
                        .map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            disabled={addingParticipant}
                            onClick={() => void handleInviteMember(member)}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                              alignItems: "center",
                              padding: "6px 8px",
                              border: `1px solid ${DASH.gold}`,
                              borderRadius: 10,
                              background: DASH.inner,
                              color: DASH.text,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              textAlign: "left",
                            }}
                          >
                            <span>
                              <strong style={{ color: DASH.gold }}>{member.name}</strong>
                              <span style={{ display: "block", fontSize: 9, color: DASH.muted }}>
                                {member.department} · {member.email}
                              </span>
                            </span>
                            <span style={{ color: DASH.gold, fontSize: 10 }}>Convidar</span>
                          </button>
                        ))
                    )}
                  </div>
                )}
              </>
            )}
            <p style={{ margin: "6px 0 0", fontSize: 9, color: DASH.muted, lineHeight: 1.4 }}>
              Só aparecem pessoas da mesma assinatura/plano. Quem estiver vendo este perfil recebe o convite com sobreposição.
            </p>
          </div>
        )}

        {!overlayPip && role === "company" && !isInitiator && (status === "ringing" || status === "accepted") && participants.length > 0 && (
          <div
            style={{
              border: `1px solid ${DASH.gold}`,
              borderRadius: 8,
              padding: 8,
              marginBottom: 10,
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: DASH.gold, textTransform: "uppercase" }}>
              Participantes ({participants.length})
            </p>
            {participants.map((part) => (
              <p key={part.id} style={{ margin: "2px 0", fontSize: 11, color: DASH.text }}>
                👤 {part.name}
              </p>
            ))}
          </div>
        )}

        {overlayPip && !minimized && (
          <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 700, color: DASH.gold }}>
            {status === "accepted" ? "Chamada" : statusLabel}
          </p>
        )}
        {error && !overlayPip && (
          <p style={{ margin: "0 0 8px", fontSize: overlayPip ? 9 : 11, color: "#f87171", lineHeight: 1.4 }}>{error}</p>
        )}

        {!overlayPip && (
        <div style={{ display: "flex", gap: overlayPip ? 4 : 8, flexWrap: "wrap" }}>
          {role === "company" && status === "idle" && (
            <button
              type="button"
              disabled={busy || !profileId}
              onClick={() => void handleChamar()}
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
                onClick={() => void handleTeamAccept()}
                style={{ ...btnGold, padding: "8px 12px", fontSize: 12, flex: 1, opacity: busy ? 0.7 : 1 }}
              >
                Aceitar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleTeamDecline()}
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
              onClick={() => void handleEnd()}
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
              onClick={() => void handleEnd()}
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
                onClick={() => void handleAccept()}
                style={{ ...btnGold, padding: "8px 12px", fontSize: 12, flex: 1, opacity: busy ? 0.7 : 1 }}
              >
                Aceitar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDecline()}
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
              onClick={() => void handleEnd()}
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
              onClick={() => {
                setStatus("idle");
                setCallId(null);
                setError("");
              }}
              style={{ ...btnGold, padding: "8px 12px", fontSize: 12, flex: 1 }}
            >
              {role === "company" ? "Nova chamada" : "Ok"}
            </button>
          )}
        </div>
        )}

        {overlayPip && status === "accepted" && !minimized && (
          <button
            type="button"
            onClick={() => void handleEnd()}
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
          <p style={{ margin: "8px 0 0", fontSize: 10, color: DASH.muted, lineHeight: 1.4, overflowWrap: "anywhere" }}>
            {role === "company"
              ? "Clique em Chamar. A câmera só liga quando o profissional aceitar. Use Sobrepor para rolar a página com o vídeo fixo."
              : "Quando a empresa ligar, use Aceitar ou Recusar. Use Sobrepor para rolar a página com o vídeo fixo."}
          </p>
        )}
    </section>
  );

  return (
    <div ref={wrapRef}>
      {panel}
    </div>
  );
}
