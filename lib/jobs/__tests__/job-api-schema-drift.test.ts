import { describe, expect, it } from "vitest";
import { jsonError, schemaDriftFromUnknown } from "@/lib/jobs/job-api";

describe("schemaDriftFromUnknown", () => {
  it("detecta P2022 com coluna no meta", () => {
    const drift = schemaDriftFromUnknown({
      code: "P2022",
      message: "Column missing",
      meta: { column: "job_postings.currency" },
    });
    expect(drift).toEqual({
      code: "SCHEMA_DRIFT",
      prismaCode: "P2022",
      column: "job_postings.currency",
    });
  });

  it("extrai coluna da mensagem Prisma", () => {
    const drift = schemaDriftFromUnknown({
      code: "P2022",
      message: 'The column `job_postings.currency` does not exist in the current database.',
    });
    expect(drift?.column).toContain("currency");
  });

  it("ignora erros sem drift de schema", () => {
    expect(schemaDriftFromUnknown(new Error("timeout"))).toBeNull();
    expect(schemaDriftFromUnknown({ code: "P1001", message: "Can't reach" })).toBeNull();
  });
});

describe("jsonError DATABASE_URL", () => {
  it("marca ausência de DATABASE_URL sem vazar a URL", async () => {
    const res = jsonError(
      new Error("Environment variable not found: DATABASE_URL."),
      "Não foi possível carregar as vagas.",
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({
      error: "Não foi possível carregar as vagas.",
      code: "DATABASE_URL_MISSING",
    });
  });

  it("expõe só o código Prisma seguro", async () => {
    const res = jsonError(
      { code: "P1001", message: "Can't reach database server at `secret-host:5432`" },
      "Não foi possível carregar as vagas.",
    );
    const body = await res.json();
    expect(body.code).toBe("PRISMA_ERROR");
    expect(body.prismaCode).toBe("P1001");
    expect(JSON.stringify(body)).not.toMatch(/secret-host/);
  });

  it("mapeia PrismaClientInitializationError sem vazar errorName", async () => {
    const err = new Error("Can't reach database server at `127.0.0.1:1`");
    err.name = "PrismaClientInitializationError";
    // Mensagem sem P-code para exercitar o ramo DB_INIT quando não é P####
    const tls = new Error("Error opening a TLS connection: self-signed certificate");
    tls.name = "PrismaClientInitializationError";
    const res = jsonError(tls, "Não foi possível carregar as vagas.");
    const body = await res.json();
    expect(body).toEqual({
      error: "Não foi possível carregar as vagas.",
      code: "DB_INIT_FAILED",
    });
    expect(body.errorName).toBeUndefined();
  });
});
