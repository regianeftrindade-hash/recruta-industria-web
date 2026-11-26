import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveAuthEmail, findUniqueUser } = vi.hoisted(() => ({
  resolveAuthEmail: vi.fn(),
  findUniqueUser: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({ resolveAuthEmail }));
vi.mock("@/lib/company-plan", () => ({ getCompanyPlanContext: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: findUniqueUser },
    profile: { findUnique: vi.fn() },
    accessRecord: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/company-storage", () => ({
  listCompanyFavoriteProfileIds: async () => [],
}));
vi.mock("@/lib/company-profile-tracking", () => ({
  getCompanyProfileTracking: async () => ({}),
  upsertCompanyProfileTracking: async () => ({}),
}));
vi.mock("@/lib/professional/record-profile-view", () => ({
  companyProfileViewType: () => "VIEW",
  recordCompanyProfileView: async () => undefined,
}));
vi.mock("@/lib/company/company-preferences", () => ({
  isAnyCompanyAnonymous: async () => false,
}));
vi.mock("@/lib/professional/professional-video-db", () => ({
  getVideoApresentacaoPathByProfileId: async () => null,
}));
vi.mock("@/lib/professional-notifications", () => ({
  notifyProfessionalAsync: () => undefined,
  notifyProfileViewed: () => undefined,
}));
vi.mock("@/lib/i18n/api-response", () => ({
  apiErrorResponse: async (key: string, status: number) =>
    Response.json({ error: key }, { status }),
}));
vi.mock("@/lib/profile/resolve-profile-ref", () => ({
  resolveProfileIdFromParam: async () => null,
}));

import { GET } from "@/app/api/company/professionals/[id]/route";
import { sanitizeUnlockedCompanyPayload } from "@/lib/privacy/company-unlocked-payload";

function req() {
  return new NextRequest("http://localhost/api/company/professionals/cmtestprofile0001");
}

describe("GET /api/company/professionals/[id] — acesso não autorizado + sanitize", () => {
  beforeEach(() => {
    resolveAuthEmail.mockReset();
    findUniqueUser.mockReset();
  });


  it("anônimo → 403", async () => {
    resolveAuthEmail.mockResolvedValue(null);
    const res = await GET(req(), { params: Promise.resolve({ id: "cmtestprofile0001" }) });
    expect(res.status).toBe(403);
  });

  it("sessão profissional → 403", async () => {
    resolveAuthEmail.mockResolvedValue({ email: "pro.teste@example.invalid" });
    findUniqueUser.mockResolvedValue({
      id: "u_pro",
      email: "pro.teste@example.invalid",
      role: "PROFESSIONAL",
    });
    const res = await GET(req(), { params: Promise.resolve({ id: "cmtestprofile0001" }) });
    expect(res.status).toBe(403);
  });

  it("empresa sem desbloqueio não recebe CPF nos dados retornados via helper", () => {
    const unsafe = {
      resumo: {
        cpf: "529.982.247-25",
        email: "cand.teste@example.invalid",
        telefone: "+55 11 98888-0000",
      },
      formEdit: {
        cpf: "529.982.247-25",
        formData: { cpf: "52998224725", email: "cand.teste@example.invalid" },
      },
    };
    const safe = sanitizeUnlockedCompanyPayload(unsafe);
    expect(JSON.stringify(safe)).not.toMatch(/\d{11}/);
    expect(safe.resumo.email).toBe("cand.teste@example.invalid");
    expect(safe.resumo.telefone).toBe("+55 11 98888-0000");
  });
});
