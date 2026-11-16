"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import SecureVideoPlayer from "@/components/shared/SecureVideoPlayer";
import { t } from "@/lib/i18n/translate";
import { localizeServerText } from "@/lib/i18n/server-text";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import {
  DASH,
  dashCard,
  dashInnerBox,
  dashSectionTitle,
} from "@/lib/dashboard-theme";
import {
  VIDEO_APRESENTACAO_ACCEPT,
  VIDEO_APRESENTACAO_MAX_BYTES,
  VIDEO_APRESENTACAO_MAX_SECONDS,
  isVideoDurationAllowed,
  pickMediaRecorderMimeType,
  readVideoDurationSeconds,
  resolveVideoMime,
} from "@/lib/professional-video";

type Mode = "idle" | "camera" | "recording" | "preview" | "uploading";

type Props = {
  initialHasVideo?: boolean;
  onVideoChange?: (hasVideo: boolean) => void;
  compact?: boolean;
  thumbnailOnly?: boolean;
};

const btnSecondary: React.CSSProperties = {
  background: "transparent",
  border: `2px solid #8D6B1F`,
  color: DASH.text,
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
};

export default function VideoApresentacaoSection({
  initialHasVideo = false,
  onVideoChange,
  compact = false,
  thumbnailOnly = false,
}: Props) {
  const [hasVideo, setHasVideo] = useState(initialHasVideo);
  const [mode, setMode] = useState<Mode>("idle");
  const [countdown, setCountdown] = useState(VIDEO_APRESENTACAO_MAX_SECONDS);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [videoVersion, setVideoVersion] = useState(0);

  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartedAtRef = useRef<number>(0);
  const previewUrlRef = useRef<string | null>(null);

  const streamUrl = hasVideo
    ? `/api/professional/video-apresentacao?v=${videoVersion}`
    : null;

  const clearCountdownTimer = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const stopMediaStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  }, []);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setPreviewBlob(null);
    setPreviewMime(null);
  }, []);

  const setPreview = useCallback((url: string) => {
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }, []);

  const resetRecorderState = useCallback(() => {
    clearCountdownTimer();
    stopMediaStream();
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setCountdown(VIDEO_APRESENTACAO_MAX_SECONDS);
    setPermissionError(null);
    setStatusMessage(null);
  }, [stopMediaStream]);

  const refreshVideoStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/professional/video-apresentacao?meta=1", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { hasVideo?: boolean; hasVideoApresentacao?: boolean };
      const attached = Boolean(data.hasVideo ?? data.hasVideoApresentacao);
      setHasVideo(attached);
      onVideoChange?.(attached);
      if (attached) setVideoVersion(Date.now());
    } catch {
      /* ignora falha de rede */
    }
  }, [onVideoChange]);

  useEffect(() => {
    if (initialHasVideo) setHasVideo(true);
  }, [initialHasVideo]);

  useEffect(() => {
    void refreshVideoStatus();
  }, [refreshVideoStatus]);

  useEffect(() => {
    return () => {
      clearCountdownTimer();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const openCamera = async () => {
    setPermissionError(null);
    setStatusMessage(null);
    revokePreview();

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionError(t("rest.video.unsupported"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play().catch(() => undefined);
      }
      setMode("camera");
    } catch {
      setPermissionError(
        t("rest.video.permission"),
      );
      setMode("idle");
    }
  };

  const startRecording = () => {
    const stream = mediaStreamRef.current;
    if (!stream) return;

    const mimeType = pickMediaRecorderMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "video/webm",
      });
      const url = URL.createObjectURL(blob);
      setPreviewBlob(blob);
      setPreviewMime(blob.type || "video/webm");
      setPreview(url);
      setMode("preview");
      stopMediaStream();
    };

    mediaRecorderRef.current = recorder;
    recordingStartedAtRef.current = Date.now();
    recorder.start(200);
    setMode("recording");
    setCountdown(VIDEO_APRESENTACAO_MAX_SECONDS);

    clearCountdownTimer();
    countdownTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartedAtRef.current) / 1000);
      const remaining = Math.max(0, VIDEO_APRESENTACAO_MAX_SECONDS - elapsed);
      setCountdown(remaining);
      if (remaining <= 0) {
        stopRecording();
      }
    }, 250);
  };

  const stopRecording = () => {
    clearCountdownTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    mediaRecorderRef.current = null;
  };

  const discardPreview = () => {
    revokePreview();
    resetRecorderState();
    setMode("idle");
  };

  const saveBlob = async (blob: Blob, fileName: string) => {
    if (blob.size > VIDEO_APRESENTACAO_MAX_BYTES) {
      setStatusMessage(t("rest.video.tooBig"));
      return false;
    }

    const mime = resolveVideoMime({ name: fileName, type: blob.type });
    if (!mime) {
      setStatusMessage(t("rest.video.badFormat"));
      return false;
    }

    setSaving(true);
    setStatusMessage(t("rest.video.uploading"));
    try {
      const formData = new FormData();
      formData.append("file", new File([blob], fileName, { type: mime }));

      const postRes = await fetch("/api/professional/video-apresentacao", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const postData = (await postRes.json().catch(() => ({}))) as { error?: string };

      if (postRes.ok) {
        setHasVideo(true);
        onVideoChange?.(true);
        setVideoVersion(Date.now());
        revokePreview();
        resetRecorderState();
        setMode("idle");
        setStatusMessage(t("rest.video.saved"));
        await refreshVideoStatus();
        return true;
      }

      if (postRes.status !== 413) {
        setStatusMessage(localizeServerText(postData.error) || t("rest.video.saveError"));
        return false;
      }

      setStatusMessage(t("rest.video.fallback"));
      const prepareRes = await fetch("/api/professional/video-apresentacao/prepare", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mime, fileName, size: blob.size }),
      });
      const prepareData = await prepareRes.json();
      if (!prepareRes.ok) {
        setStatusMessage(localizeServerText(prepareData.error) || t("rest.video.prepareError"));
        return false;
      }

      const uploadRes = await fetch(prepareData.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mime,
          "x-upsert": "true",
        },
        body: blob,
      });

      if (!uploadRes.ok) {
        setStatusMessage(
          t("fix.video.uploadFail").replace("{status}", String(uploadRes.status)),
        );
        return false;
      }

      const completeRes = await fetch("/api/professional/video-apresentacao/complete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: prepareData.path }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        setStatusMessage(localizeServerText(completeData.error) || t("rest.video.saveError"));
        return false;
      }

      setHasVideo(true);
      onVideoChange?.(true);
      setVideoVersion(Date.now());
      revokePreview();
      resetRecorderState();
      setMode("idle");
      setStatusMessage(t("rest.video.saved"));
      await refreshVideoStatus();
      return true;
    } catch {
      setStatusMessage(t("rest.video.networkSave"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreview = async () => {
    if (!previewBlob) return;

    const previewDuration = previewVideoRef.current?.duration;
    if (!isVideoDurationAllowed(previewDuration)) {
      setStatusMessage(t("fix.video.tooLong").replace("{seconds}", String(VIDEO_APRESENTACAO_MAX_SECONDS)));
      return;
    }

    const ext = previewBlob.type.includes("mp4") ? "mp4" : previewBlob.type.includes("quicktime") ? "mov" : "webm";
    await saveBlob(previewBlob, `apresentacao.${ext}`);
  };

  const handlePreviewMetadata = (duration: number) => {
    if (!isVideoDurationAllowed(duration)) {
      setStatusMessage(
        t("fix.video.tooLong").replace("{seconds}", String(VIDEO_APRESENTACAO_MAX_SECONDS)),
      );
      discardPreview();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPermissionError(null);
    setStatusMessage(null);

    const mime = resolveVideoMime(file);

    if (!mime) {
      setStatusMessage(t("rest.video.badFormat"));
      return;
    }

    if (file.size > VIDEO_APRESENTACAO_MAX_BYTES) {
      setStatusMessage(t("rest.video.tooBig"));
      return;
    }

    const duration = await readVideoDurationSeconds(file);
    if (!isVideoDurationAllowed(duration)) {
      setStatusMessage(t("fix.video.tooLong").replace("{seconds}", String(VIDEO_APRESENTACAO_MAX_SECONDS)));
      return;
    }

    revokePreview();
    const url = URL.createObjectURL(file);
    setPreviewBlob(file);
    setPreviewMime(mime);
    setPreview(url);
    setMode("preview");

    if (duration == null) {
      setStatusMessage(
        t("rest.video.previewReady"),
      );
    }
  };

  const handleRemoveSaved = async () => {
    if (!confirm(t("rest.video.confirmRemove"))) return;
    setSaving(true);
    try {
      const res = await fetch("/api/professional/video-apresentacao", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        setStatusMessage(localizeServerText(data.error) || t("rest.video.removeError"));
        return;
      }
      setHasVideo(false);
      onVideoChange?.(false);
      setStatusMessage(t("rest.video.removed"));
    } catch {
      setStatusMessage(t("rest.video.networkRemove"));
    } finally {
      setSaving(false);
    }
  };

  const btnCompactGold: React.CSSProperties = {
    ...btnGold,
    padding: "6px 12px",
    fontSize: 11,
  };

  const btnRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
    justifyContent: compact ? "center" : "flex-end",
  };

  const previewThumbStyle: React.CSSProperties = {
    width: "min(200px, 100%)",
    aspectRatio: "16 / 9",
    borderRadius: 8,
    objectFit: "cover",
    background: "#000",
    border: "1px solid rgba(141, 107, 31, 0.45)",
    display: "block",
    marginInline: compact ? "auto" : undefined,
  };

  const previewPlaceholderStyle: React.CSSProperties = {
    width: "min(200px, 100%)",
    aspectRatio: "16 / 9",
    borderRadius: 8,
    background: "#F3E6C8",
    border: "1px dashed rgba(141, 107, 31, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    color: "var(--dash-text, #414141)",
    marginInline: compact ? "auto" : undefined,
  };

  const content = (
    <>
      {!compact && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <h3 style={{ ...dashSectionTitle, margin: 0, fontSize: 14 }}>
              {t("fix.video.title")}
            </h3>
            {hasVideo && mode === "idle" && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#1a3d1a",
                  background: "rgba(72, 187, 120, 0.22)",
                  border: "1px solid rgba(72, 187, 120, 0.55)",
                  borderRadius: 999,
                  padding: "4px 10px",
                  letterSpacing: "0.02em",
                }}
              >
                {t("rest.video.attached")}
              </span>
            )}
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 11, color: DASH.muted, lineHeight: 1.5 }}>
            {t("rest.video.intro")}
          </p>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 10,
              color: DASH.gold,
              lineHeight: 1.45,
              padding: "8px 10px",
              ...dashInnerBox,
            }}
          >
            <strong>{t("rest.video.warning")}</strong> {t("rest.video.warningBody")}
          </p>
        </>
      )}

      {compact && (
        <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--dash-text, #414141)", lineHeight: 1.45, textAlign: "right" }}>
          {t("rest.video.compact")}
        </p>
      )}

      {hasVideo && mode === "idle" && streamUrl && (
        <div style={{ marginBottom: compact ? 8 : 12, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
          {thumbnailOnly || compact ? (
            <video
              src={streamUrl}
              muted
              playsInline
              preload="metadata"
              style={previewThumbStyle}
            />
          ) : (
            <>
              <div
                style={{
                  marginBottom: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  ...dashInnerBox,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "rgba(200, 155, 60, 0.2)",
                    border: `2px solid #8D6B1F`,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  ▶
                </span>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: DASH.text, fontWeight: 700 }}>
                    {t("rest.video.savedTitle")}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: DASH.muted, lineHeight: 1.4 }}>
                    {t("rest.video.savedHint")}
                  </p>
                </div>
              </div>
              <SecureVideoPlayer src={streamUrl} />
            </>
          )}
          <div style={btnRowStyle}>
            <button type="button" onClick={() => void openCamera()} style={compact ? btnCompactGold : btnSecondary}>
              {t("rest.video.record")}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={btnSecondary}
            >
              {t("rest.video.uploadExisting")}
            </button>
            <button
              type="button"
              onClick={() => void handleRemoveSaved()}
              disabled={saving}
              style={{ ...btnSecondary, borderColor: "#a44", color: "#f88" }}
            >
              {t("rest.video.remove")}
            </button>
          </div>
        </div>
      )}

      {!hasVideo && mode === "idle" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 8, marginBottom: compact ? 0 : 12 }}>
          {compact && <div style={previewPlaceholderStyle} aria-hidden>🎬</div>}
          <div style={btnRowStyle}>
            <button type="button" onClick={() => void openCamera()} style={compact ? btnCompactGold : { ...btnGold, padding: "10px 14px", fontSize: 12 }}>
              {t("rest.video.record")}
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={btnSecondary}>
              {t("rest.video.uploadExisting")}
            </button>
          </div>
        </div>
      )}

      {permissionError && (
        <p style={{ margin: "0 0 10px", fontSize: 11, color: "#f88", lineHeight: 1.45 }}>
          {permissionError}
        </p>
      )}

      {(mode === "camera" || mode === "recording") && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              position: "relative",
              borderRadius: 8,
              overflow: "hidden",
              background: "#000",
              ...dashInnerBox,
            }}
          >
            <video
              ref={liveVideoRef}
              playsInline
              muted
              autoPlay
              style={{ width: "100%", maxHeight: 280, display: "block", objectFit: "cover" }}
            />
            {mode === "recording" && (
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "rgba(0,0,0,0.75)",
                  color: "#fff",
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 800,
                  border: "1px solid #c89b3c",
                }}
              >
                {countdown}s
              </div>
            )}
          </div>
          <div style={btnRowStyle}>
            {mode === "camera" && (
              <button type="button" onClick={startRecording} style={{ ...btnGold, padding: "8px 14px", fontSize: 12 }}>
                {t("fix.video.start")}
              </button>
            )}
            {mode === "recording" && (
              <button type="button" onClick={stopRecording} style={{ ...btnGold, padding: "8px 14px", fontSize: 12 }}>
                Parar
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (mode === "recording") stopRecording();
                resetRecorderState();
                setMode("idle");
              }}
              style={btnSecondary}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mode === "preview" && previewUrl && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 8px", fontSize: 10, color: DASH.muted, fontWeight: 700 }}>
            {t("fix.video.preview")}
          </p>
          <video
            ref={previewVideoRef}
            controls
            playsInline
            preload="auto"
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d) && d > 0) handlePreviewMetadata(d);
            }}
            onError={() => {
              setStatusMessage(
                t("rest.video.playError"),
              );
            }}
            style={{
              width: "100%",
              maxHeight: 280,
              borderRadius: 8,
              background: "#000",
            }}
          >
            {previewUrl && (
              <source src={previewUrl} type={previewMime || undefined} />
            )}
          </video>
          <div style={btnRowStyle}>
            <button
              type="button"
              onClick={() => previewVideoRef.current?.play()}
              style={btnSecondary}
            >
              {t("fix.video.watch")}
            </button>
            <button
              type="button"
              onClick={() => void handleSavePreview()}
              disabled={saving}
              style={{ ...btnGold, padding: "8px 14px", fontSize: 12, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? t("surface.reset.saving") : t("rest.video.save")}
            </button>
            <button type="button" onClick={discardPreview} disabled={saving} style={btnSecondary}>
              Descartar
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <p style={{ margin: 0, fontSize: 11, color: DASH.muted, lineHeight: 1.45 }}>{statusMessage}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={VIDEO_APRESENTACAO_ACCEPT}
        style={{ display: "none" }}
        onChange={(e) => void handleFileSelected(e)}
      />
    </>
  );

  if (compact) {
    return <div>{content}</div>;
  }

  return (
    <section style={{ ...dashCard, padding: 14, boxShadow: DASH.shadow }}>
      {content}
    </section>
  );
}
