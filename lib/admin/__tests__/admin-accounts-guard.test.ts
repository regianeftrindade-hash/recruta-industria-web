import { describe, expect, it } from "vitest";
import { getAdminEmails, isAdminUser } from "@/lib/auth/admin-auth";

describe("admin accounts guards", () => {
  it("inclui admin@recrutaindustria.com nos e-mails padrão", () => {
    expect(getAdminEmails()).toContain("admin@recrutaindustria.com");
    expect(isAdminUser("admin@recrutaindustria.com")).toBe(true);
    expect(isAdminUser("usuario.comum@gmail.com")).toBe(false);
  });
});
