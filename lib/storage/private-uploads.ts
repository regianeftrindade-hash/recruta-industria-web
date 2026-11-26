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

export async function downloadPrivateFile(filePath: string): Promise<Buffer | null> {
  const clean = filePath.replace(/^\/+/, "").split("?")[0];
  if (!clean || clean.includes("..") || clean.includes("\\")) return null;
  const supabase = getSupabase();
  const bucket = getUploadsBucket();
  const { data, error } = await supabase.storage.from(bucket).download(clean);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

/** Remove arquivos do bucket (exclusão de conta / LGPD). Falhas são retornadas, não lançadas. */
export async function removePrivateFiles(paths: string[]): Promise<{ removed: string[]; failed: string[] }> {
  const cleaned = [
    ...new Set(
      paths
        .map((p) => {
          const raw = String(p || "").trim();
          if (!raw) return "";
          if (raw.includes("://")) return extractStoragePath(raw) || "";
          return raw.replace(/^\/+/, "").split("?")[0];
        })
        .filter((p) => p && !p.includes("..") && !p.includes("\\")),
    ),
  ];
  if (cleaned.length === 0) return { removed: [], failed: [] };

  try {
    const supabase = getSupabase();
    const bucket = getUploadsBucket();
    const { error } = await supabase.storage.from(bucket).remove(cleaned);
    if (error) return { removed: [], failed: cleaned };
    return { removed: cleaned, failed: [] };
  } catch {
    return { removed: [], failed: cleaned };
  }
}

const UPLOAD_TYPE_PREFIXES = [
  "documents",
  "images",
  "avatars",
  "logos",
  "cnpj",
  "curriculos",
  "certificados",
  "company-cnpj",
  "company-logo",
  "company-responsavel",
  "cnh-documentos",
  "curso-certificados",
] as const;

/** Prefixos de pasta do usuário autenticado no upload (`tipo/emailSanitizado`). */
export function uploadOwnerFolderPrefixes(email: string): string[] {
  const owner = sanitizeUploadOwnerPrefix(email);
  if (!owner) return [];
  return UPLOAD_TYPE_PREFIXES.map((type) => `${type}/${owner}`);
}

export function professionalVideoFolderPrefix(userId: string): string | null {
  const id = String(userId || "").trim();
  if (!id || id.includes("..") || id.includes("/")) return null;
  return `professional-videos/${id}`;
}

/**
 * Coleta paths de storage a partir de JSON/objetos (ex.: formDataJSON).
 * Aceita paths relativos ou URLs do bucket.
 */
export function collectStoragePathsFromUnknown(value: unknown): string[] {
  const found = new Set<string>();

  const consider = (raw: string) => {
    const text = raw.trim();
    if (!text || text.length > 800) return;
    if (text.includes("://") || text.startsWith("/api/media/sign")) {
      const extracted = extractStoragePath(text);
      if (extracted) found.add(extracted);
      return;
    }
    if (
      !text.includes("..")
      && !text.includes("\\")
      && !text.includes("\0")
      && /^[a-z0-9@._/-]+$/i.test(text)
      && text.includes("/")
    ) {
      found.add(text.replace(/^\/+/, "").split("?")[0]);
    }
  };

  const walk = (node: unknown, depth: number) => {
    if (depth > 8 || node == null) return;
    if (typeof node === "string") {
      consider(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    if (typeof node === "object") {
      for (const v of Object.values(node as Record<string, unknown>)) {
        walk(v, depth + 1);
      }
    }
  };

  if (typeof value === "string") {
    try {
      walk(JSON.parse(value), 0);
    } catch {
      consider(value);
    }
  } else {
    walk(value, 0);
  }

  return [...found];
}

/** Lista e remove arquivos sob prefixos `pasta/dono` (best-effort). */
export async function removePrivateFilesByPrefixes(
  prefixes: string[],
): Promise<{ removed: string[]; failed: string[] }> {
  const cleanedPrefixes = [
    ...new Set(
      prefixes
        .map((p) => String(p || "").replace(/^\/+/, "").replace(/\/+$/, ""))
        .filter((p) => p && !p.includes("..") && !p.includes("\\") && p.includes("/")),
    ),
  ];
  if (cleanedPrefixes.length === 0) return { removed: [], failed: [] };

  const removed: string[] = [];
  const failed: string[] = [];

  try {
    const supabase = getSupabase();
    const bucket = getUploadsBucket();

    for (const prefix of cleanedPrefixes) {
      const folder = prefix;
      // Pagina até esgotar (limite da API Storage = 1000 por chamada).
      let offset = 0;
      const pageSize = 1000;
      let sawError = false;
      for (;;) {
        const { data, error } = await supabase.storage.from(bucket).list(folder, {
          limit: pageSize,
          offset,
        });
        if (error) {
          failed.push(prefix);
          sawError = true;
          break;
        }
        const page = data || [];
        const paths = page
          .map((row) => row?.name)
          .filter((name): name is string => Boolean(name))
          .map((name) => `${folder}/${name}`);
        if (paths.length === 0) break;
        const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
        if (removeError) failed.push(...paths);
        else removed.push(...paths);
        if (page.length < pageSize) break;
        offset += pageSize;
        // Segurança: evita loop infinito em listagens inconsistentes.
        if (offset > 100_000) break;
      }
      if (sawError) continue;
    }
  } catch {
    failed.push(...cleanedPrefixes);
  }

  return { removed, failed };
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
 * - professional-videos/{userId}/: só o dono ou admin
 * - {pasta}/{emailSanitizado}/: só o dono daquele prefixo ou admin
 * - arquivo de outra pessoa: a rota só libera se a empresa tiver desbloqueio daquele perfil
 */
export function mediaPathMatchesStoredFile(requestedPath: string, stored: string | null | undefined): boolean {
  const requested = String(requestedPath || "").replace(/^\/+/, "").split("?")[0];
  if (!requested || requested.includes("..") || requested.includes("\\")) return false;
  const raw = String(stored || "").trim();
  if (!raw) return false;
  const extracted = raw.includes("://")
    ? extractStoragePath(raw)
    : raw.replace(/^\/+/, "").split("?")[0];
  return Boolean(extracted) && extracted === requested;
}
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

  const mine = sanitizeUploadOwnerPrefix(input.email);
  return Boolean(ownerSeg) && ownerSeg.toLowerCase() === mine.toLowerCase();
}

/** Link que a empresa abre. Cada clique volta a passar por /api/media/sign. */
export function companyDocumentHref(stored: string | null | undefined): string | null {
  const raw = String(stored || "").trim();
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return null;
  if (raw.startsWith("/api/media/sign?") || raw.startsWith("/api/company/professionals/")) return raw;

  const path = raw.includes("://")
    ? extractStoragePath(raw)
    : raw.replace(/^\/+/, "").split("?")[0];
  if (!path || path.includes("..") || path.includes("\\") || path.includes("\0")) return null;
  return `/api/media/sign?path=${encodeURIComponent(path)}&redirect=1`;
}

