import { describe, expect, it } from "vitest";
import { clientIpFromHeaders } from "@/lib/security/api-guard";

describe("IP do cliente", () => {
  it("ignora um X-Forwarded-For prefixado quando a Vercel informa o IP", () => {
    const ip = clientIpFromHeaders({
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      "x-vercel-forwarded-for": "203.0.113.9",
    });
    expect(ip).toBe("203.0.113.9");
  });

  it("usa o último salto se só houver X-Forwarded-For", () => {
    expect(clientIpFromHeaders({ "x-forwarded-for": "1.2.3.4, 198.51.100.20" })).toBe("198.51.100.20");
  });
});
