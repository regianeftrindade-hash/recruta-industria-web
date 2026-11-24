import { afterEach, describe, expect, it } from "vitest";
import { env } from "node:process";
import { ensurePgBouncerParam, resolveDatabaseUrl } from "@/lib/infra/db";

describe("resolveDatabaseUrl", () => {
  const previous = env.DATABASE_URL;

  afterEach(() => {
    if (previous === undefined) delete env.DATABASE_URL;
    else env.DATABASE_URL = previous;
  });

  it("devolve undefined quando a env está ausente ou só com espaços", () => {
    delete env.DATABASE_URL;
    expect(resolveDatabaseUrl()).toBeUndefined();
    env.DATABASE_URL = "   ";
    expect(resolveDatabaseUrl()).toBeUndefined();
  });

  it("devolve a URL trimada quando definida", () => {
    env.DATABASE_URL = "  postgresql://user:pass@host:5432/db  ";
    expect(resolveDatabaseUrl()).toBe("postgresql://user:pass@host:5432/db");
  });

  it("injeta pgbouncer=true no pooler :6543", () => {
    env.DATABASE_URL =
      "postgresql://user:pass@aws-1-sa-east-1.pooler.supabase.com:6543/postgres";
    const resolved = resolveDatabaseUrl();
    expect(resolved).toContain("pgbouncer=true");
    expect(resolved).toContain("6543");
  });
});

describe("ensurePgBouncerParam", () => {
  it("não altera URL direta :5432 sem pooler", () => {
    const url = "postgresql://user:pass@db.example.com:5432/postgres?sslmode=require";
    expect(ensurePgBouncerParam(url)).toBe(url);
  });

  it("não duplica pgbouncer=true", () => {
    const url =
      "postgresql://user:pass@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
    expect(ensurePgBouncerParam(url)).toBe(url);
  });
});
