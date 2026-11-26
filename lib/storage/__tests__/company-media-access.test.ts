import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUniqueUser,
  resolveCompanyOwnerUserId,
  getCompanyVerificationInfo,
  findManyUnlocks,
  findManyProfiles,
} = vi.hoisted(() => ({
  findUniqueUser: vi.fn(),
  resolveCompanyOwnerUserId: vi.fn(),
  getCompanyVerificationInfo: vi.fn(),
  findManyUnlocks: vi.fn(),
  findManyProfiles: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: findUniqueUser },
    accessRecord: { findMany: findManyUnlocks },
    profile: { findMany: findManyProfiles },
  },
}));
vi.mock("@/lib/company/company-team", () => ({ resolveCompanyOwnerUserId }));
vi.mock("@/lib/company-storage", () => ({ getCompanyVerificationInfo }));

import { companyMayReadUnlockedFile } from "@/lib/storage/company-media-access";

describe("companyMayReadUnlockedFile", () => {
  beforeEach(() => {
    findUniqueUser.mockReset();
    resolveCompanyOwnerUserId.mockReset();
    getCompanyVerificationInfo.mockReset();
    findManyUnlocks.mockReset();
    findManyProfiles.mockReset();
  });

  it("nega sem verificação mesmo com unlock", async () => {
    findUniqueUser.mockResolvedValue({ id: "c1", role: "COMPANY" });
    resolveCompanyOwnerUserId.mockResolvedValue("c1");
    getCompanyVerificationInfo.mockResolvedValue({
      canAccessSensitiveProfiles: false,
    });

    await expect(
      companyMayReadUnlockedFile("empresa@example.com", "docs/curriculo.pdf"),
    ).resolves.toBe(false);
    expect(findManyUnlocks).not.toHaveBeenCalled();
  });

  it("permite com verificação + unlock + path correspondente", async () => {
    findUniqueUser.mockResolvedValue({ id: "c1", role: "COMPANY" });
    resolveCompanyOwnerUserId.mockResolvedValue("c1");
    getCompanyVerificationInfo.mockResolvedValue({
      canAccessSensitiveProfiles: true,
    });
    findManyUnlocks.mockResolvedValue([{ profileId: "p1" }]);
    findManyProfiles.mockResolvedValue([
      {
        curricoURL: "docs/curriculo.pdf",
        atestadoURL: null,
        formDataJSON: null,
      },
    ]);

    await expect(
      companyMayReadUnlockedFile("empresa@example.com", "docs/curriculo.pdf"),
    ).resolves.toBe(true);
  });
});
