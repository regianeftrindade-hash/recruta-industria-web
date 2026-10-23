import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { POST } from "@/app/api/asaas/webhook/route";

const TOKEN_KEY = "ASAAS_WEBHOOK_TOKEN";
const SECRET_KEY = "ASAAS_WEBHOOK_SECRET";

const saved = {
  token: process.env[TOKEN_KEY],
  secret: process.env[SECRET_KEY],
  nodeEnv: process.env.NODE_ENV,
};

function restoreEnv() {
  if (saved.token === undefined) delete process.env[TOKEN_KEY];
  else process.env[TOKEN_KEY] = saved.token;
  if (saved.secret === undefined) delete process.env[SECRET_KEY];
  else process.env[SECRET_KEY] = saved.secret;
  if (saved.nodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = saved.nodeEnv;
}

afterEach(() => {
  restoreEnv();
});

function syntheticSecret(): string {
  return randomBytes(24).toString("hex");
}

async function postWebhook(input: {
  ip: string;
  header?: string;
  headerName?: string;
}) {
  const headers = new Headers({
    "content-type": "application/json",
    "x-forwarded-for": input.ip,
  });
  if (input.header !== undefined) {
    headers.set(input.headerName ?? "asaas-access-token", input.header);
  }
  const request = new NextRequest("https://www.recrutaindustria.com/api/asaas/webhook", {
    method: "POST",
    headers,
    body: "{}",
  });
  const response = await POST(request);
  const body = (await response.json()) as { error?: string; ok?: boolean; ignored?: boolean };
  return { status: response.status, error: body.error ?? null, ok: body.ok ?? null, ignored: body.ignored ?? null };
}

describe("webhook Asaas — autenticação", () => {
  it("em produção, requisição sem token recebe 401", async () => {
    process.env.NODE_ENV = "production";
    delete process.env[TOKEN_KEY];
    delete process.env[SECRET_KEY];

    const result = await postWebhook({ ip: "203.0.113.21" });

    expect(result.status).toBe(401);
    expect(result.error).toBe("unauthorized");
  });

  it("rejeita o cabeçalho asaas-access-token quando o valor não confere", async () => {
    process.env.NODE_ENV = "production";
    process.env[TOKEN_KEY] = syntheticSecret();
    delete process.env[SECRET_KEY];

    const result = await postWebhook({
      ip: "203.0.113.22",
      header: syntheticSecret(),
    });

    expect(result.status).toBe(401);
    expect(result.error).toBe("unauthorized");
  });

  it("aceita o cabeçalho asaas-access-token igual a ASAAS_WEBHOOK_TOKEN", async () => {
    process.env.NODE_ENV = "production";
    const expected = syntheticSecret();
    process.env[TOKEN_KEY] = expected;
    delete process.env[SECRET_KEY];

    const result = await postWebhook({
      ip: "203.0.113.23",
      header: expected,
    });

    expect(result.status).toBe(200);
    expect(result.ok).toBe(true);
    expect(result.ignored).toBe(true);
  });

  it("usa ASAAS_WEBHOOK_SECRET quando ASAAS_WEBHOOK_TOKEN está ausente", async () => {
    process.env.NODE_ENV = "production";
    const expected = syntheticSecret();
    delete process.env[TOKEN_KEY];
    process.env[SECRET_KEY] = expected;

    const accepted = await postWebhook({
      ip: "203.0.113.24",
      header: expected,
    });
    const rejected = await postWebhook({
      ip: "203.0.113.25",
      header: syntheticSecret(),
    });

    expect(accepted.status).toBe(200);
    expect(accepted.ignored).toBe(true);
    expect(rejected.status).toBe(401);
  });
});
