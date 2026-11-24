import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { matchWebhookSecret } from "@/lib/security/webhook-auth";

function req(url: string, headers?: Record<string, string>) {
  return new NextRequest(url, { headers });
}

describe("matchWebhookSecret", () => {
  const prevNode = process.env.NODE_ENV;
  const prevAllow = process.env.WEBHOOK_ALLOW_QUERY_SECRET;

  afterEach(() => {
    process.env.NODE_ENV = prevNode;
    if (prevAllow === undefined) delete process.env.WEBHOOK_ALLOW_QUERY_SECRET;
    else process.env.WEBHOOK_ALLOW_QUERY_SECRET = prevAllow;
  });

  it("aceita header em produção e rejeita query sem flag", () => {
    process.env.NODE_ENV = "production";
    delete process.env.WEBHOOK_ALLOW_QUERY_SECRET;
    expect(
      matchWebhookSecret({
        request: req("https://app.example/api/asaas/webhook", {
          "asaas-access-token": "segredo",
        }),
        expected: "segredo",
        headerNames: ["asaas-access-token"],
        queryParam: "token",
      }),
    ).toBe(true);

    expect(
      matchWebhookSecret({
        request: req("https://app.example/api/asaas/webhook?token=segredo"),
        expected: "segredo",
        headerNames: ["asaas-access-token"],
        queryParam: "token",
      }),
    ).toBe(false);
  });

  it("aceita query quando WEBHOOK_ALLOW_QUERY_SECRET=true", () => {
    process.env.NODE_ENV = "production";
    process.env.WEBHOOK_ALLOW_QUERY_SECRET = "true";
    expect(
      matchWebhookSecret({
        request: req("https://app.example/api/wh?token=abc"),
        expected: "abc",
        headerNames: ["asaas-access-token"],
        queryParam: "token",
      }),
    ).toBe(true);
  });

  it("em desenvolvimento aceita query para compatibilidade local", () => {
    process.env.NODE_ENV = "development";
    delete process.env.WEBHOOK_ALLOW_QUERY_SECRET;
    expect(
      matchWebhookSecret({
        request: req("http://localhost/api/wh?secret=local"),
        expected: "local",
        headerNames: ["x-webhook-secret"],
        queryParam: "secret",
      }),
    ).toBe(true);
  });
});
