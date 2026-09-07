import type { NextRequest } from "next/server";
import { enforceApiRateLimitAsync } from "@/lib/security/rate-limit";

/** Extrai IP do cliente (proxy-aware). */
export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers;

  const forwarded = headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return headers.get("x-real-ip")?.trim() || "unknown";
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