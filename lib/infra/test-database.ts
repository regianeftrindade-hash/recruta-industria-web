import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Os testes que gravam no banco só podem usar TEST_DATABASE_URL.
 * DATABASE_URL e DIRECT_URL da aplicação nunca são reaproveitados.
 * Sem banco de teste, os testes são pulados. Destino inseguro interrompe
 * a execução antes de abrir conexão.
 */

const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "host.docker.internal",
]);

export type PostgresTarget = {
  host: string;
  port: string;
  database: string;
};

export type TestDatabaseDecision =
  | { action: "run"; databaseUrl: string; directUrl: string }
  | { action: "skip"; reason: string }
  | { action: "block"; reason: string };

type DatabaseEnv = {
  appDatabaseUrl?: string;
  appDirectUrl?: string;
  testDatabaseUrl?: string;
  testDirectUrl?: string;
};

let capturedAppEnv: Pick<DatabaseEnv, "appDatabaseUrl" | "appDirectUrl"> | null = null;
let applied: TestDatabaseDecision | null = null;

export function parsePostgresTarget(raw: string | undefined | null): PostgresTarget | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;
  const normalized = trimmed.startsWith("postgres://")
    ? `postgresql://${trimmed.slice("postgres://".length)}`
    : trimmed;
  if (!normalized.startsWith("postgresql://")) return null;

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const database = decodeURIComponent(url.pathname.replace(/^\//, "")).split("/")[0];
  if (!host || !database) return null;
  return { host, port: url.port || "5432", database };
}

export function isLocalPostgresHost(host: string): boolean {
  return LOCAL_HOSTS.has(host.toLowerCase());
}

export function isIsolatedTestDatabaseName(database: string): boolean {
  return /(^|[_\-])test($|[_\-])/i.test(database);
}

function sameTarget(left: PostgresTarget, right: PostgresTarget): boolean {
  return left.host === right.host
    && left.port === right.port
    && left.database.toLowerCase() === right.database.toLowerCase();
}

function sameServer(left: PostgresTarget, right: PostgresTarget): boolean {
  return left.host === right.host && left.port === right.port;
}

export function assessTestDatabase(env: DatabaseEnv): TestDatabaseDecision {
  const testDatabaseUrl = env.testDatabaseUrl?.trim() ?? "";
  const testDirectUrl = env.testDirectUrl?.trim() || testDatabaseUrl;
  if (!testDatabaseUrl) {
    return {
      action: "skip",
      reason: "TEST_DATABASE_URL não está definido. Os testes que gravam no banco foram pulados.",
    };
  }

  const testTarget = parsePostgresTarget(testDatabaseUrl);
  const directTarget = parsePostgresTarget(testDirectUrl);
  if (!testTarget || !directTarget) {
    return {
      action: "block",
      reason: "TEST_DATABASE_URL ou TEST_DIRECT_URL não é uma URL PostgreSQL válida. Nenhum teste conectou.",
    };
  }

  const appTargets = [env.appDatabaseUrl, env.appDirectUrl]
    .map((value) => parsePostgresTarget(value))
    .filter((target): target is PostgresTarget => target !== null);

  for (const appTarget of appTargets) {
    if (sameTarget(testTarget, appTarget) || sameTarget(directTarget, appTarget)) {
      return {
        action: "block",
        reason: "O banco de testes é o mesmo banco da aplicação. A conexão foi recusada.",
      };
    }
    if (
      (!isLocalPostgresHost(testTarget.host) && sameServer(testTarget, appTarget))
      || (!isLocalPostgresHost(directTarget.host) && sameServer(directTarget, appTarget))
    ) {
      return {
        action: "block",
        reason: "O banco de testes usa o mesmo servidor da aplicação. A conexão foi recusada.",
      };
    }
  }

  for (const target of [testTarget, directTarget]) {
    if (!isLocalPostgresHost(target.host)) {
      return {
        action: "block",
        reason: "O banco de testes precisa ser PostgreSQL local. Servidor remoto foi recusado.",
      };
    }
    if (!isIsolatedTestDatabaseName(target.database)) {
      return {
        action: "block",
        reason: "O banco de testes local precisa de um nome isolado, como recruta_test. A conexão foi recusada.",
      };
    }
  }

  return { action: "run", databaseUrl: testDatabaseUrl, directUrl: testDirectUrl };
}

function readEnvFile(filename: string): Record<string, string> {
  const file = path.resolve(process.cwd(), filename);
  if (!existsSync(file)) return {};
  const values: Record<string, string> = {};
  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (values[key] === undefined) values[key] = value;
  }
  return values;
}

function readEnvFiles(): Record<string, string> {
  const merged = readEnvFile(".env");
  for (const [key, value] of Object.entries(readEnvFile(".env.local"))) {
    merged[key] = value;
  }
  return merged;
}

function collectDatabaseEnv(): DatabaseEnv {
  const files = readEnvFiles();
  if (!capturedAppEnv) {
    capturedAppEnv = {
      appDatabaseUrl: process.env.DATABASE_URL ?? files.DATABASE_URL,
      appDirectUrl: process.env.DIRECT_URL ?? files.DIRECT_URL,
    };
  }
  return {
    ...capturedAppEnv,
    testDatabaseUrl: process.env.TEST_DATABASE_URL ?? files.TEST_DATABASE_URL,
    testDirectUrl: process.env.TEST_DIRECT_URL ?? files.TEST_DIRECT_URL,
  };
}

export function applyIsolatedTestDatabase(): TestDatabaseDecision {
  if (applied) return applied;

  const files = readEnvFiles();
  const decision = assessTestDatabase(collectDatabaseEnv());
  delete process.env.DATABASE_URL;
  delete process.env.DIRECT_URL;

  if (decision.action === "block") {
    applied = decision;
    throw new Error(decision.reason);
  }
  if (decision.action === "run") {
    for (const [key, value] of Object.entries(files)) {
      if (key === "DATABASE_URL" || key === "DIRECT_URL") continue;
      if (process.env[key] === undefined) process.env[key] = value;
    }
    process.env.DATABASE_URL = decision.databaseUrl;
    process.env.DIRECT_URL = decision.directUrl;
  }
  applied = decision;
  return decision;
}

export function currentTestDatabaseDecision(): TestDatabaseDecision {
  return applied ?? assessTestDatabase(collectDatabaseEnv());
}

export function isIsolatedTestDatabaseReady(): boolean {
  return currentTestDatabaseDecision().action === "run";
}

export function assertIsolatedTestDatabase(): void {
  const decision = currentTestDatabaseDecision();
  if (decision.action === "block") throw new Error(decision.reason);
  if (decision.action !== "run") {
    throw new Error("Teste de banco interrompido: não há PostgreSQL de teste isolado.");
  }
  const active = parsePostgresTarget(process.env.DATABASE_URL);
  const expected = parsePostgresTarget(decision.databaseUrl);
  if (!active || !expected || !sameTarget(active, expected)) {
    throw new Error("Teste de banco interrompido: a conexão ativa não é o banco de testes isolado.");
  }
}
