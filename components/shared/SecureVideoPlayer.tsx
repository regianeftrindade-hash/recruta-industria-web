"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function SecureVideoPlayer({ src, className, style }: Props) {
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const revoke = () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };

    async function loadVideo() {
      setLoading(true);
      setError(null);
      setPlaybackUrl(null);
      revoke();

      try {
        const res = await fetch(src, { credentials: "include" });
        const contentType = res.headers.get("content-type") || "";

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error || `Erro ao carregar vídeo (${res.status})`,
          );
        }

        if (contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error((data as { error?: string }).error || "Vídeo indisponível.");
        }

        const blob = await res.blob();
        if (cancelled) return;

        if (!blob.size) {
          throw new Error("O arquivo de vídeo está vazio.");
        }

        const typedBlob = blob.type.startsWith("video/")
          ? blob
          : contentType.startsWith("video/")
            ? new Blob([blob], { type: contentType.split(";")[0].trim() })
            : blob;

        const url = URL.createObjectURL(typedBlob);
        objectUrlRef.current = url;
        setPlaybackUrl(url);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Não foi possível carregar o vídeo.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadVideo();

    return () => {
      cancelled = true;
      revoke();
    };
  }, [src]);

  if (loading) {
    return (
      <p style={{ margin: 0, fontSize: 11, color: "#9a9a9a", padding: "12px 0" }}>
        Carregando vídeo...
      </p>
    );
  }

  if (error) {
    return (
      <p style={{ margin: 0, fontSize: 11, color: "#f88", lineHeight: 1.45, padding: "8px 0" }}>
        {error}
      </p>
    );
  }

  if (!playbackUrl) return null;

  return (
    <video
      src={playbackUrl}
      controls
      playsInline
      preload="auto"
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      className={className}
      style={{
        width: "100%",
        maxHeight: 320,
        borderRadius: 8,
        background: "#000",
        display: "block",
        ...style,
      }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
