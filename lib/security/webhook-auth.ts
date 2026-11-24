import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

function safeEqualString(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    return ba.length === bb.length && timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function allowQuerySecret(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.WEBHOOK_ALLOW_QUERY_SECRET === "true";
}

/**
 * Autenticação de webhook por header (preferido).
 * Query string só em desenvolvimento ou com WEBHOOK_ALLOW_QUERY_SECRET=true
 * (migração temporária de URLs antigas no painel do gateway).
 */
export function matchWebhookSecret(input: {
  request: NextRequest;
  expected: string | undefined | null;
  headerNames: string[];
  queryParam?: string;
}): boolean {
  const expected = input.expected?.trim();
  if (!expected) {
    return process.env.NODE_ENV !== "production";
  }

  for (const name of input.headerNames) {
    const header = input.request.headers.get(name);
    if (header && safeEqualString(header, expected)) return true;
  }

  if (input.queryParam && allowQuerySecret()) {
    const fromQuery = new URL(input.request.url).searchParams.get(input.queryParam) || "";
    if (fromQuery && safeEqualString(fromQuery, expected)) return true;
  }

  return false;
}
