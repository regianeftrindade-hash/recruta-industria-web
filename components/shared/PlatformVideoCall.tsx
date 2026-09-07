"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { DASH, dashCard, dashSectionTitle } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";

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

const MAX_PARTICIPANTES_EMPRESA = 4;

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
  const streamRef = useRef<MediaStream | null>(null);

  const [overlay, setOverlay] = useState(false);
  const [fixedPos, setFixedPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [placeholderH, setPlaceholderH] = useState(0);
  const [minimized, setMinimized] = useState(false);

  const [callId, setCallId] = useState<string | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [incomingCompany, setIncomingCompany] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
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

  // Convite da equipe: abre sobreposição automaticamente
  useEffect(() => {
    if (role !== "company" || status !== "team_invite" || overlay) return;
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPlaceholderH(rect.height);
    setFixedPos({
      top: Math.max(8, rect.top),
      left: Math.max(8, rect.left),
      width: rect.width,
    });
    setOverlay(true);
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
    const el = panelRef.current;
    if (!el) {
      setOverlay(true);
      return;
    }
    const rect = el.getBoundingClientRect();
    setPlaceholderH(rect.height);
    setFixedPos({
      top: Math.max(8, rect.top),
      left: Math.max(8, rect.left),
      width: rect.width,
    });
    setOverlay(true);
  };

  const disableOverlay = () => {
    setOverlay(false);
    setFixedPos(null);
    setPlaceholderH(0);
    setMinimized(false);
  };

  const toggleOverlay = () => {
    if (overlay) disableOverlay();
    else enableOverlay();
  };

  const panelBase: React.CSSProperties = {
    ...dashCard,
    border: `1px solid ${DASH.gold}`,
    borderRadius: 16,
    overflow: "hidden",
    padding: compact ? 12 : 14,
    background: DASH.card,
    boxSizing: "border-box",
  };

  const panelStyle: React.CSSProperties = overlay
    ? {
        ...panelBase,
        position: "fixed",
        top: fixedPos?.top ?? 16,
        left: fixedPos?.left ?? 16,
        width: minimized ? Math.min(220, fixedPos?.width || 220) : fixedPos?.width || (compact ? 280 : 340),
        maxWidth: "calc(100vw - 16px)",
        zIndex: 9999,
        boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
      }
    : {
        ...panelBase,
        width: "100%",
        maxWidth: compact ? 280 : "100%",
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
          padding: "5px 8px",
          fontSize: 10,
          background: overlay ? DASH.gold : "transparent",
          color: overlay ? "#000" : DASH.gold,
          border: `1px solid ${DASH.gold}`,
          boxShadow: overlay ? undefined : "none",
        }}
        title="Mantém o vídeo no lugar enquanto você rola a página"
      >
        {overlay ? "Fixo ✓" : "Sobrepor"}
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
            padding: "5px 8px",
            fontSize: 10,
            cursor: "pointer",
          }}
        >
          {minimized ? "Expandir" : "Minimizar"}
        </button>
      )}
    </div>
  );

  if (minimized && overlay) {
    return (
      <div ref={wrapRef}>
        {placeholderH > 0 && <div aria-hidden style={{ height: placeholderH }} />}
        <section ref={panelRef as React.RefObject<HTMLElement>} className="dash-card" style={panelStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: DASH.gold }}>
              📹 {statusLabel}
            </span>
            {controls}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div ref={wrapRef}>
      {overlay && placeholderH > 0 && <div aria-hidden style={{ height: placeholderH }} />}
      <section ref={panelRef as React.RefObject<HTMLElement>} className="dash-card" style={panelStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ ...dashSectionTitle, color: DASH.gold, margin: 0, fontSize: compact ? 13 : 14 }}>
            📹 {title}
          </h3>
          {controls}
        </div>

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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              aspectRatio: "4 / 3",
              borderRadius: 10,
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
          </div>

          {role === "professional" && status === "accepted" ? (
            /* Grade 2x2: até 4 participantes da empresa */
            <div
              style={{
                aspectRatio: "4 / 3",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gridTemplateRows: "1fr 1fr",
                gap: 4,
              }}
            >
              {Array.from({ length: MAX_PARTICIPANTES_EMPRESA }, (_, i) => {
                const participante = participants[i];
                return (
                  <div
                    key={participante?.id || `slot-${i}`}
                    style={{
                      borderRadius: 8,
                      overflow: "hidden",
                      border: `2px solid ${participante ? DASH.gold : DASH.border}`,
                      background: participante ? "#111" : "#0a0a0a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      color: DASH.muted,
                      fontSize: 9,
                      textAlign: "center",
                      padding: 4,
                      opacity: participante ? 1 : 0.5,
                    }}
                  >
                    {participante ? "Conectado" : "Vago"}
                    <span
                      style={{
                        position: "absolute",
                        left: 3,
                        bottom: 3,
                        fontSize: 8,
                        fontWeight: 700,
                        background: "rgba(0,0,0,0.65)",
                        color: DASH.gold,
                        padding: "1px 5px",
                        borderRadius: 4,
                        maxWidth: "calc(100% - 6px)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {participante?.name || `${i + 1}º`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                aspectRatio: "4 / 3",
                borderRadius: 10,
                overflow: "hidden",
                border: `1px solid ${DASH.gold}`,
                background: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                color: DASH.muted,
                fontSize: 11,
                textAlign: "center",
                padding: 8,
              }}
            >
              {status === "accepted" ? `Conectado com ${peerLabel}` : `Aguardando ${peerLabel}…`}
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
                Remoto
              </span>
            </div>
          )}
        </div>

        {role === "company" && (isInitiator || status === "idle") && (
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

        {role === "company" && !isInitiator && (status === "ringing" || status === "accepted") && participants.length > 0 && (
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

        {error && (
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "#f87171", lineHeight: 1.4 }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                padding: "8px 12px",
                fontSize: 12,
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

        <p style={{ margin: "8px 0 0", fontSize: 10, color: DASH.muted, lineHeight: 1.4 }}>
          {role === "company"
            ? "Clique em Chamar. A câmera só liga quando o profissional aceitar. Use Sobrepor para rolar a página com o vídeo fixo."
            : "Quando a empresa ligar, use Aceitar ou Recusar. Use Sobrepor para rolar a página com o vídeo fixo."}
        </p>
      </section>
    </div>
  );
}
