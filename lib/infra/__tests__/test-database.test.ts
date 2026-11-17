import { describe, expect, it } from "vitest";
import {
  assessTestDatabase,
  isIsolatedTestDatabaseName,
  parsePostgresTarget,
} from "@/lib/infra/test-database";

const localTest = "postgresql://usuario:senha@127.0.0.1:5432/recruta_test";
const localApp = "postgresql://usuario:senha@127.0.0.1:5432/recruta";
const remoteApp = "postgresql://usuario:senha@db.exemplo.supabase.co:5432/postgres";

describe("banco de testes isolado", () => {
  it("não reconhece o banco da aplicação como banco de teste", () => {
    expect(isIsolatedTestDatabaseName("recruta")).toBe(false);
    expect(isIsolatedTestDatabaseName("postgres")).toBe(false);
    expect(isIsolatedTestDatabaseName("recruta_test")).toBe(true);
  });

  it("pula quando não há TEST_DATABASE_URL", () => {
    expect(assessTestDatabase({ appDatabaseUrl: remoteApp }).action).toBe("skip");
  });

  it("aceita Postgres local com nome isolado, diferente do banco da aplicação", () => {
    const decision = assessTestDatabase({
      appDatabaseUrl: remoteApp,
      appDirectUrl: remoteApp,
      testDatabaseUrl: localTest,
    });
    expect(decision.action).toBe("run");
  });

  it("recusa o mesmo banco da aplicação", () => {
    const decision = assessTestDatabase({
      appDatabaseUrl: localTest,
      testDatabaseUrl: localTest,
    });
    expect(decision.action).toBe("block");
  });

  it("recusa servidor remoto, mesmo com nome de teste", () => {
    const decision = assessTestDatabase({
      appDatabaseUrl: localApp,
      testDatabaseUrl: "postgresql://usuario:senha@db.exemplo.supabase.co:5432/recruta_test",
    });
    expect(decision.action).toBe("block");
  });

  it("recusa banco local sem nome isolado", () => {
    const decision = assessTestDatabase({
      testDatabaseUrl: localApp,
    });
    expect(decision.action).toBe("block");
  });

  it("recusa TEST_DIRECT_URL apontando para o banco da aplicação", () => {
    const decision = assessTestDatabase({
      appDirectUrl: remoteApp,
      testDatabaseUrl: localTest,
      testDirectUrl: remoteApp,
    });
    expect(decision.action).toBe("block");
  });

  it("não aceita URL que não seja PostgreSQL", () => {
    expect(parsePostgresTarget("mysql://127.0.0.1/recruta_test")).toBeNull();
    expect(assessTestDatabase({ testDatabaseUrl: "nao-e-url" }).action).toBe("block");
  });
});
