import { describe, expect, it, afterEach } from "vitest";
import { isRuntimeDdlEnabled } from "@/lib/infra/ensure-db-schema";

describe("company-chat-db", () => {
  const prev = process.env.DISABLE_RUNTIME_DDL;
  afterEach(() => {
    if (prev === undefined) delete process.env.DISABLE_RUNTIME_DDL;
    else process.env.DISABLE_RUNTIME_DDL = prev;
  });

  it("respeita DISABLE_RUNTIME_DDL sem CREATE", async () => {
    process.env.DISABLE_RUNTIME_DDL = "true";
    expect(isRuntimeDdlEnabled()).toBe(false);
    const { ensureCompanyChatMessageTable } = await import("@/lib/company/company-chat-db");
    await expect(ensureCompanyChatMessageTable()).resolves.toBeUndefined();
  });
});
