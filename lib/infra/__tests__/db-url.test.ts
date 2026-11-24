import { afterEach, describe, expect, it } from "vitest";
import { env } from "node:process";
import {
  ensurePgBouncerParam,
  PREVIEW_PRODUCTION_BLOCK_URL,
  PRODUCTION_SUPABASE_PROJECT_REF,
  resolveDatabaseUrl,
  STAGING_SUPABASE_PROJECT_REF,
} from "@/lib/infra/db";

describe("resolveDatabaseUrl", () => {
  const previousDb = env.DATABASE_URL;
  const previousStaging = env.STAGING_DATABASE_URL;
  const previousVercel = env.VERCEL_ENV;

  afterEach(() => {
    if (previousDb === undefined) delete env.DATABASE_URL;
    else env.DATABASE_URL = previousDb;
    if (previousStaging === undefined) delete env.STAGING_DATABASE_URL;
    else env.STAGING_DATABASE_URL = previousStaging;
    if (previousVercel === undefined) delete env.VERCEL_ENV;
    else env.VERCEL_ENV = previousVercel;
  });

  it("devolve undefined quando a env está ausente ou só com espaços", () => {
    delete env.VERCEL_ENV;
    delete env.STAGING_DATABASE_URL;
    delete env.DATABASE_URL;
    expect(resolveDatabaseUrl()).toBeUndefined();
    env.DATABASE_URL = "   ";
    expect(resolveDatabaseUrl()).toBeUndefined();
  });

  it("devolve a URL trimada quando definida", () => {
    delete env.VERCEL_ENV;
    delete env.STAGING_DATABASE_URL;
    env.DATABASE_URL = "  postgresql://user:pass@host:5432/db  ";
    expect(resolveDatabaseUrl()).toBe("postgresql://user:pass@host:5432/db");
  });

  it("injeta pgbouncer=true no pooler :6543", () => {
    delete env.VERCEL_ENV;
    delete env.STAGING_DATABASE_URL;
    env.DATABASE_URL =
      "postgresql://user:pass@aws-1-sa-east-1.pooler.supabase.com:6543/postgres";
    const resolved = resolveDatabaseUrl();
    expect(resolved).toContain("pgbouncer=true");
    expect(resolved).toContain("6543");
  });

  it("em Preview prefere STAGING_DATABASE_URL", () => {
    env.VERCEL_ENV = "preview";
    env.DATABASE_URL = `postgresql://user.${PRODUCTION_SUPABASE_PROJECT_REF}:pass@aws-1-us-east-2.pooler.supabase.com:6543/postgres`;
    env.STAGING_DATABASE_URL = `postgresql://user.${STAGING_SUPABASE_PROJECT_REF}:pass@aws-1-sa-east-1.pooler.supabase.com:6543/postgres`;
    const resolved = resolveDatabaseUrl();
    expect(resolved).toContain(STAGING_SUPABASE_PROJECT_REF);
    expect(resolved).toContain("pgbouncer=true");
    expect(resolved).not.toContain(PRODUCTION_SUPABASE_PROJECT_REF);
  });

  it("em Preview bloqueia DATABASE_URL do projeto Production com sentinel (sem fallback)", () => {
    env.VERCEL_ENV = "preview";
    delete env.STAGING_DATABASE_URL;
    env.DATABASE_URL = `postgresql://user.${PRODUCTION_SUPABASE_PROJECT_REF}:pass@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true`;
    expect(resolveDatabaseUrl()).toBe(PREVIEW_PRODUCTION_BLOCK_URL);
  });

  it("em Preview bloqueia host us-east-2 mesmo sem ref no username", () => {
    env.VERCEL_ENV = "preview";
    delete env.STAGING_DATABASE_URL;
    env.DATABASE_URL =
      "postgresql://postgres:pass@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
    expect(resolveDatabaseUrl()).toBe(PREVIEW_PRODUCTION_BLOCK_URL);
  });

  it("em Production continua usando DATABASE_URL do projeto Production", () => {
    env.VERCEL_ENV = "production";
    delete env.STAGING_DATABASE_URL;
    env.DATABASE_URL = `postgresql://user.${PRODUCTION_SUPABASE_PROJECT_REF}:pass@aws-1-us-east-2.pooler.supabase.com:6543/postgres`;
    const resolved = resolveDatabaseUrl();
    expect(resolved).toContain(PRODUCTION_SUPABASE_PROJECT_REF);
    expect(resolved).toContain("pgbouncer=true");
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

  it("não injeta pgbouncer na porta 5432 do pooler (DIRECT_URL)", () => {
    const url =
      "postgresql://user:pass@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require";
    expect(ensurePgBouncerParam(url)).toBe(url);
  });
});
