import { afterEach, describe, expect, it } from "vitest";
import { env } from "node:process";
import { resolveDatabaseUrl } from "@/lib/infra/db";

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
});
