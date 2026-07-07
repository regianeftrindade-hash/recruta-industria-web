export const VIDEO_APRESENTACAO_MAX_SECONDS = 30;
export const VIDEO_APRESENTACAO_MAX_BYTES = 25 * 1024 * 1024;

export const VIDEO_APRESENTACAO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export const VIDEO_APRESENTACAO_ACCEPT =
  'video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm';

const EXT_BY_MIME: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export function isAllowedVideoMime(mime: string): boolean {
  return (VIDEO_APRESENTACAO_MIME_TYPES as readonly string[]).includes(mime);
}

export function extensionForVideoMime(mime: string): string {
  return EXT_BY_MIME[mime] || 'webm';
}

export function mimeFromFileName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.m4v')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return null;
}

/** Resolve MIME do arquivo enviado (navegadores variam, principalmente no celular). */
export function resolveVideoMime(file: Pick<File, 'name' | 'type'>): string | null {
  const rawType = file.type?.split(';')[0]?.trim().toLowerCase() ?? '';
  if (rawType && isAllowedVideoMime(rawType)) return rawType;

  const fromName = mimeFromFileName(file.name);
  if (fromName) return fromName;

  if (!rawType || rawType === 'application/octet-stream') {
    return mimeFromFileName(file.name);
  }

  return null;
}

export function contentTypeFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.m4v')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.webm')) return 'video/webm';
  return 'video/mp4';
}

export function pickMediaRecorderMimeType(): string | undefined {
  if (typeof window === 'undefined' || !window.MediaRecorder) return undefined;
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

export async function readVideoDurationSeconds(file: File): Promise<number | null> {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');

    let settled = false;
    const finish = (duration: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
      resolve(duration);
    };

    const timeoutId = window.setTimeout(() => finish(null), 12_000);

    const readDuration = () => {
      const duration = video.duration;
      if (Number.isFinite(duration) && duration > 0) {
        finish(duration);
      }
    };

    video.addEventListener('loadedmetadata', readDuration);
    video.addEventListener('loadeddata', readDuration);
    video.addEventListener('durationchange', readDuration);
    video.addEventListener('error', () => finish(null));

    video.src = url;
    video.load();
  });
}

export function isVideoDurationAllowed(duration: number | null | undefined): boolean {
  if (duration == null || !Number.isFinite(duration) || duration <= 0) return true;
  return duration <= VIDEO_APRESENTACAO_MAX_SECONDS + 0.5;
}
