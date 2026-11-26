import { afterEach, describe, expect, it } from "vitest";
import {
  __resetMemoryRateLimitsForTests,
  checkAPIRateLimitMemory,
  enforceApiRateLimitAsync,
  getRateLimitBackend,
  isUpstashRateLimitConfigured,
} from "@/lib/security/rate-limit";

describe("rate-limit", () => {
  afterEach(() => {
    __resetMemoryRateLimitsForTests();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("sem Upstash usa backend memória e ainda limita", async () => {
    expect(isUpstashRateLimitConfigured()).toBe(false);
    expect(getRateLimitBackend()).toBe("memory");

    expect(await enforceApiRateLimitAsync("t:a", 2, 60_000)).toBe(true);
    expect(await enforceApiRateLimitAsync("t:a", 2, 60_000)).toBe(true);
    expect(await enforceApiRateLimitAsync("t:a", 2, 60_000)).toBe(false);
  });

  it("não é fail-open: estouro continua bloqueando", () => {
    expect(checkAPIRateLimitMemory("mem:1", 1, 60_000)).toBe(true);
    expect(checkAPIRateLimitMemory("mem:1", 1, 60_000)).toBe(false);
  });

  it("detecta Upstash configurado sem expor valores", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token-test";
    expect(isUpstashRateLimitConfigured()).toBe(true);
    expect(getRateLimitBackend()).toBe("upstash");
  });
});
