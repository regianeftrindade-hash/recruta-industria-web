"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import { CALL_RTC_CONFIG } from "@/lib/video-call-peer";
import type { CallStatus } from "./types";

type Options = {
  status: CallStatus;
  callId: string | null;
  cameraOn: boolean;
  role: "company" | "professional";
  isInitiator: boolean;
  streamRef: MutableRefObject<MediaStream | null>;
  remoteRef: RefObject<HTMLVideoElement | null>;
  setRemoteLive: (live: boolean) => void;
};

/**
 * Troca o vídeo remoto via WebRTC (a câmera local sozinha não chega no outro).
 * Empresa iniciadora cria a offer; demais respondem com answer.
 */
export function usePlatformVideoCallWebRtc({
  status,
  callId,
  cameraOn,
  role,
  isInitiator,
  streamRef,
  remoteRef,
  setRemoteLive,
}: Options) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const seenSignalsRef = useRef<Set<string>>(new Set());
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);

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
  }, [status, callId, cameraOn, role, isInitiator, streamRef, remoteRef, setRemoteLive]);
}
