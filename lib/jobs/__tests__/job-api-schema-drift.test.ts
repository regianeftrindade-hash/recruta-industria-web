import { describe, expect, it } from "vitest";
import { schemaDriftFromUnknown } from "@/lib/jobs/job-api";

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
