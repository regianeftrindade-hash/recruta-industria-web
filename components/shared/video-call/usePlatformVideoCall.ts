"use client";

import { useEffect, useState } from "react";
import type { ApiCall, CallStatus, Participant, RhMember } from "./types";

type Options = {
  role: "company" | "professional";
  profileId?: string;
  stopCamera: () => void;
  startCamera: () => Promise<void>;
  cameraOn: boolean;
  overlay: boolean;
  setOverlay: (v: boolean) => void;
  setMinimized: (v: boolean) => void;
  setError: (msg: string) => void;
};

/**
 * Estado da chamada + polls de API + handlers (exceto WebRTC/câmera).
 */
export function usePlatformVideoCall({
  role,
  profileId,
  stopCamera,
  startCamera,
  cameraOn,
  overlay,
  setOverlay,
  setMinimized,
  setError,
}: Options) {
  const [callId, setCallId] = useState<string | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [incomingCompany, setIncomingCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [addingParticipant] = useState(false);
  const [rhMembers, setRhMembers] = useState<RhMember[]>([]);
  const [loadingRhMembers, setLoadingRhMembers] = useState(false);
  const [showRhMembers, setShowRhMembers] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<RhMember[]>([]);
  const [isInitiator, setIsInitiator] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- igual ao componente original
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

  const disableOverlay = () => {
    setOverlay(false);
    setMinimized(false);
  };

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

  const resetIdle = () => {
    setStatus("idle");
    setCallId(null);
    setError("");
  };

  return {
    callId,
    status,
    incomingCompany,
    busy,
    participants,
    addingParticipant,
    rhMembers,
    loadingRhMembers,
    showRhMembers,
    pendingInvites,
    setPendingInvites,
    isInitiator,
    extrasCount,
    podeConvidarMais,
    handleChamar,
    handleAccept,
    handleTeamAccept,
    handleTeamDecline,
    handleDecline,
    handleEnd,
    loadRhMembers,
    handleInviteMember,
    handleRemoveParticipant,
    resetIdle,
    pinAsOverlay,
    disableOverlay,
  };
}
