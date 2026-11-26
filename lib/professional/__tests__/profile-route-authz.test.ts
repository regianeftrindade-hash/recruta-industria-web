import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getToken, findUnique } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getToken: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("next-auth/jwt", () => ({ getToken }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique, create: vi.fn(), update: vi.fn() },
    profile: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));
vi.mock("@/lib/i18n/resolve-interface-locale", () => ({
  resolveInterfaceLocale: async () => "pt-BR",
}));
vi.mock("@/lib/professional/professional-video-db", () => ({
  getVideoApresentacaoPath: async () => null,
}));
vi.mock("@/lib/profile-snapshot", () => ({
  getProfileFormSnapshot: async () => null,
  saveProfileFormSnapshot: async () => undefined,
}));

import { GET, POST } from "@/app/api/professional/profile/route";

function req(method = "GET", body?: unknown) {
  return new NextRequest("http://localhost/api/professional/profile", {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET/POST /api/professional/profile — autorização", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    getToken.mockReset();
    findUnique.mockReset();
    getToken.mockResolvedValue(null);
    process.env.NEXTAUTH_SECRET = "segredo-de-teste";
  });

  it("anônimo → 401", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it("empresa → 403 sem vazar formEdit", async () => {
    getServerSession.mockResolvedValue({ user: { email: "empresa.teste@example.invalid" } });
    findUnique.mockResolvedValue({
      id: "u_co",
      name: "Empresa Teste",
      email: "empresa.teste@example.invalid",
      role: "COMPANY",
      image: null,
      passwordHash: "x",
    });
    const res = await GET(req());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/profissionais/i);
    expect(body.formEdit).toBeUndefined();
    expect(body.email).toBeUndefined();
  });

  it("profissional sem perfil → 200 incompleto", async () => {
    getServerSession.mockResolvedValue({ user: { email: "pro.teste@example.invalid" } });
    findUnique.mockResolvedValue({
      id: "u_pro",
      name: "Pro Teste",
      email: "pro.teste@example.invalid",
      role: "PROFESSIONAL",
      image: null,
      passwordHash: "x",
    });
    const { prisma } = await import("@/lib/db");
    (prisma.profile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasProfile).toBe(false);
    expect(body.email).toBe("pro.teste@example.invalid");
  });

  it("POST empresa → 403", async () => {
    getServerSession.mockResolvedValue({ user: { email: "empresa.teste@example.invalid" } });
    findUnique.mockResolvedValue({
      id: "u_co",
      name: "Empresa Teste",
      email: "empresa.teste@example.invalid",
      role: "COMPANY",
      image: null,
      passwordHash: "x",
    });
    const res = await POST(req("POST", { nome: "Hack" }));
    expect(res.status).toBe(403);
  });
});
