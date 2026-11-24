import type { NextRequest } from "next/server";
import { enforceApiRateLimitAsync } from "@/lib/security/rate-limit";

function headerValue(
  source: { get(name: string): string | null } | Record<string, string | string[] | undefined>,
  name: string,
): string {
  if (typeof (source as { get?: unknown }).get === "function") {
    return (source as { get(name: string): string | null }).get(name)?.trim() || "";
  }
  const raw = (source as Record<string, string | string[] | undefined>)[name];
  if (Array.isArray(raw)) return raw[0]?.trim() || "";
  return String(raw || "").trim();
}

/**
 * IP do cliente. Na Vercel, `x-vercel-forwarded-for` é definido pela plataforma
 * e não pode ser prefixado pelo navegador. O primeiro valor de `x-forwarded-for`
 * pode ser inventado, então só entra como último recurso, pelo endereço final.
 */
export function clientIpFromHeaders(
  source: { get(name: string): string | null } | Record<string, string | string[] | undefined>,
): string {
  const vercel = headerValue(source, "x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]?.trim() || "unknown";

  const real = headerValue(source, "x-real-ip");
  if (real) return real;

  const forwarded = headerValue(source, "x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    return parts[parts.length - 1] || "unknown";
  }

  return "unknown";
}

/** Extrai IP do cliente (proxy-aware). */
export function getClientIp(request: NextRequest | Request): string {
  return clientIpFromHeaders(request.headers);
}

/**
 * Rate limit de API.
 * Usa Upstash quando configurado e memória como fallback.
 */
export async function enforceApiRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  return enforceApiRateLimitAsync(key, limit, windowMs);
}

/** Mascara e-mail para respostas públicas. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");

  if (!local || !domain) {
    return "***";
  }

  const visible = local.slice(0, Math.min(2, local.length));

  return `${visible}***@${domain}`;
}