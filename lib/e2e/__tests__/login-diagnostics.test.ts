import { describe, expect, it } from "vitest";
import {
  emailFingerprint,
  extractNextAuthError,
  extractSchemaDriftHint,
  normalizeE2eSecret,
} from "../login-diagnostics";

describe("e2e login diagnostics", () => {
  it("normalizeE2eSecret remove aspas de secrets colados", () => {
    expect(normalizeE2eSecret('  "senha"  ')).toBe("senha");
    expect(normalizeE2eSecret("'user@x.com'")).toBe("user@x.com");
    expect(normalizeE2eSecret("sem-aspas")).toBe("sem-aspas");
  });

  it("extractNextAuthError lê error da query quando JSON não tem campo error", () => {
    expect(
      extractNextAuthError({
        url: "https://www.recrutaindustria.com/api/auth/error?error=CredentialsSignin&provider=credentials",
      }),
    ).toBe("CredentialsSignin");
    expect(extractNextAuthError({ error: "CredentialsSignin" })).toBe("CredentialsSignin");
    expect(extractNextAuthError({})).toBeNull();
  });

  it("extractSchemaDriftHint reconhece P2022 / countryCode", () => {
    expect(extractSchemaDriftHint("The column `User.countryCode` does not exist")).toBe(
      "User.countryCode",
    );
    expect(extractSchemaDriftHint("P2022 countryCode")).toMatch(/internacional/i);
  });

  it("emailFingerprint não vaza o local-part", () => {
    const fp = emailFingerprint("profissional.teste@recrutaindustria.com");
    expect(fp).toContain("domain=recrutaindustria.com");
    expect(fp).toContain("localLen=");
    expect(fp).not.toContain("profissional");
  });
});
