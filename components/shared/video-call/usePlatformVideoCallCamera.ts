"use client";

import { useCallback, useEffect, type MutableRefObject, type RefObject } from "react";

type Options = {
  localRef: RefObject<HTMLVideoElement | null>;
  streamRef: MutableRefObject<MediaStream | null>;
  cameraOn: boolean;
  setCameraOn: (on: boolean) => void;
  setError: (msg: string) => void;
};

export function usePlatformVideoCallCamera({
  localRef,
  streamRef,
  cameraOn,
  setCameraOn,
  setError,
}: Options) {
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (localRef.current) localRef.current.srcObject = null;
    setCameraOn(false);
  }, [localRef, streamRef, setCameraOn]);

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
  }, [localRef, streamRef, setCameraOn, setError]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [streamRef]);

  return { startCamera, stopCamera };
}
