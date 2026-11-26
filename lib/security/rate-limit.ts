import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/** Fallback em memória (Edge-safe, sem Prisma). Sempre protege — nunca “abre” o endpoint. */
const memoryLimits = new Map<string, { count: number; resetTime: number }>();

let warnedMissingUpstash = false;
let warnedUpstashFailure = false;

function memoryRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = memoryLimits.get(identifier);

  if (!current || now > current.resetTime) {
    memoryLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count < limit) {
    current.count++;
    return true;
  }

  return false;
}

let redis: Redis | null = null;
const limiterCache = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  if (!redis) {
    redis = new Redis({ url, token });
  }
  return redis;
}

/** Backend efetivo do rate-limit (sem expor credenciais). */
export function getRateLimitBackend(): "upstash" | "memory" {
  return isUpstashRateLimitConfigured() ? "upstash" : "memory";
}

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  const key = `${limit}:${windowMs}`;
  let limiter = limiterCache.get(key);
  if (!limiter) {
    const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: "ri-rl",
      analytics: false,
    });
    limiterCache.set(key, limiter);
  }
  return limiter;
}

/**
 * Rate limit distribuído (Upstash) com fallback em memória.
 * Retorna true se a requisição pode seguir.
 */
export async function enforceApiRateLimitAsync(
  identifier: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const limiter = getLimiter(limit, windowMs);
  if (!limiter) {
    if (!warnedMissingUpstash && process.env.NODE_ENV === "production") {
      warnedMissingUpstash = true;
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_* ausente — usando memória (ainda limitado; não é fail-open)",
      );
    }
    return memoryRateLimit(identifier, limit, windowMs);
  }

  try {
    const result = await limiter.limit(identifier);
    return result.success;
  } catch (error) {
    if (!warnedUpstashFailure) {
      warnedUpstashFailure = true;
      console.warn("[rate-limit] Upstash falhou — fallback memória (ainda limitado):", error);
    }
    return memoryRateLimit(identifier, limit, windowMs);
  }
}

/** Só testes — limpa mapa em memória. */
export function __resetMemoryRateLimitsForTests(): void {
  memoryLimits.clear();
  warnedMissingUpstash = false;
  warnedUpstashFailure = false;
}

export function isUpstashRateLimitConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim()
    && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

/** Compat: sync só memória (preferir async). */
export function checkAPIRateLimitMemory(
  identifier: string,
  limit = 100,
  windowMs = 60000,
): boolean {
  return memoryRateLimit(identifier, limit, windowMs);
}
