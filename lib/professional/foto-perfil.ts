/** Caminho estável da foto no storage, ou null se o valor não for uma foto de perfil. */
export function caminhoFotoPerfil(value: string | null | undefined): string | null {
  const raw = String(value || "").trim();
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return null;

  let path = raw;
  if (raw.includes("://") || raw.startsWith("/")) {
    try {
      const url = new URL(raw, "https://local.invalid");
      const pathname = url.pathname;
      const markers = ["/object/sign/", "/object/public/"];
      let found = "";
      for (const marker of markers) {
        const index = pathname.indexOf(marker);
        if (index === -1) continue;
        const rest = decodeURIComponent(pathname.slice(index + marker.length));
        const slash = rest.indexOf("/");
        if (slash === -1) continue;
        found = rest.slice(slash + 1);
        break;
      }
      path = found;
    } catch {
      return null;
    }
  }

  path = path.replace(/^\/+/, "").split("?")[0];
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (!path.startsWith("avatars/") || path.includes("..") || path.includes("\\") || path.includes("\0")) {
    return null;
  }
  return path;
}

/** O que fica gravado no perfil: o caminho, nunca a URL temporária nem o preview local. */
export function fotoPerfilParaSalvar(value: string | null | undefined): string | null {
  return caminhoFotoPerfil(value);
}

/** Endereço que a tag img consegue abrir. Renova o link quando o valor é um caminho do storage. */
export function fotoPerfilSrc(value: string | null | undefined): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const path = caminhoFotoPerfil(raw);
  if (path) return `/api/media/sign?path=${encodeURIComponent(path)}&redirect=1`;
  if (
    raw.startsWith("data:image") ||
    raw.startsWith("blob:") ||
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("/uploads")
  ) {
    return raw;
  }
  return "";
}

/** Atualiza só a foto dentro do snapshot já salvo. */
export function patchFotoNoSnapshot(snapshot: string | null, path: string): string {
  let parsed: Record<string, unknown> = {};
  if (snapshot) {
    try {
      const value = JSON.parse(snapshot) as unknown;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        parsed = value as Record<string, unknown>;
      }
    } catch {
      parsed = {};
    }
  }
  const nested = parsed.formData;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    (nested as Record<string, unknown>).fotoPerfil = path;
  }
  parsed.fotoPerfil = path;
  return JSON.stringify(parsed);
}
