import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("política de upload", () => {
  const source = readFileSync(
    join(process.cwd(), "app/api/upload/route.ts"),
    "utf8",
  );

  it("exige autenticação para pastas empresariais e documentos sensíveis", () => {
    expect(source).toContain("AUTH_REQUIRED_UPLOAD_TYPES");
    expect(source).toContain("company-cnpj");
    expect(source).toContain("cnh-documentos");
    expect(source).toMatch(/Faça login para enviar este tipo de arquivo/);
  });

  it("mantém pastas de pré-cadastro anônimas com limite menor", () => {
    expect(source).toContain("ANON_ALLOWED_UPLOAD_TYPES");
    expect(source).toContain("curriculos");
    expect(source).toContain("MAX_FILE_SIZE_ANON");
  });
});
