import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "uploads";
const SIGNED_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

let client: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Variáveis do Supabase não configuradas");
  }
  client = createClient(url, key);
  return client;
}

export function getUploadsBucket(): string {
  return process.env.SUPABASE_UPLOADS_BUCKET?.trim() || BUCKET;
}

/** Pastas que podem ser lidas sem login (avatares/logos públicos). */
export function isPublicMediaFolder(path: string): boolean {
  const first = path.split("/")[0]?.toLowerCase() || "";
  return ["avatars", "logos", "company-logo", "images"].includes(first);
}

export async function uploadPrivateFile(
  filePath: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ path: string; signedUrl: string | null; publicUrl: string | null }> {
  const supabase = getSupabase();
  const bucket = getUploadsBucket();

  const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const preferPrivate = process.env.UPLOADS_PRIVATE !== "false";

  if (preferPrivate) {
    const { data, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, SIGNED_TTL_SECONDS);

    if (!signError && data?.signedUrl) {
      return { path: filePath, signedUrl: data.signedUrl, publicUrl: null };
    }
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return { path: filePath, signedUrl: null, publicUrl: data.publicUrl };
}

export async function createSignedMediaUrl(
  filePath: string,
  expiresIn = SIGNED_TTL_SECONDS,
): Promise<string | null> {
  const supabase = getSupabase();
  const bucket = getUploadsBucket();
  const clean = filePath.replace(/^\/+/, "").split("?")[0];
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(clean, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Extrai path relativo a partir de URL pública/assinada do bucket. */
export function extractStoragePath(urlOrPath: string): string | null {
  if (!urlOrPath) return null;
  if (!urlOrPath.includes("://") && !urlOrPath.startsWith("/")) {
    return urlOrPath.replace(/^\/+/, "");
  }
  try {
    const u = new URL(urlOrPath);
    const marker = `/object/public/${getUploadsBucket()}/`;
    const markerSign = `/object/sign/${getUploadsBucket()}/`;
    const full = u.pathname;
    if (full.includes(marker)) {
      return decodeURIComponent(full.split(marker)[1] || "");
    }
    if (full.includes(markerSign)) {
      return decodeURIComponent((full.split(markerSign)[1] || "").split("?")[0]);
    }
    return null;
  } catch {
    return null;
  }
}

/** Prefixo de dono usado em `app/api/upload` (e-mail sanitizado). */
export function sanitizeUploadOwnerPrefix(email: string): string {
  return email.replace(/[^a-z0-9@._-]/gi, "_").slice(0, 80);
}

/**
 * ACL de mídia assinada (puro, testável).
 * - Pastas públicas: ok sem login
 * - professional-videos/{userId}/: só dono ou admin
 * - {pasta}/{emailSanitizado}/: dono, empresa autenticada ou admin
 * - demais privadas: só admin
 */
export function canSignMediaPath(input: {
  path: string;
  email?: string | null;
  userId?: string | null;
  role?: string | null;
  isAdmin?: boolean;
}): boolean {
  const path = String(input.path || "").replace(/^\/+/, "");
  if (!path || path.includes("..")) return false;
  if (isPublicMediaFolder(path)) return true;

  if (input.isAdmin) return true;
  if (!input.email) return false;

  const parts = path.split("/").filter(Boolean);
  const folder = (parts[0] || "").toLowerCase();
  const ownerSeg = parts[1] || "";

  if (folder === "professional-videos") {
    return Boolean(input.userId && ownerSeg === input.userId);
  }

  if (input.email) {
    const mine = sanitizeUploadOwnerPrefix(input.email);
    if (ownerSeg && ownerSeg.toLowerCase() === mine.toLowerCase()) return true;
  }

  const role = String(input.role || "").toUpperCase();
  if (role === "COMPANY" || role === "ADMIN") return true;

  return false;
}

