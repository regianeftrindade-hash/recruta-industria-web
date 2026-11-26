import { describe, expect, it, vi, beforeEach } from "vitest";

const { findMany, count } = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    jobPosting: { findMany, count },
  },
}));

vi.mock("@/lib/infra/ensure-db-schema", () => ({
  ensureInternationalDefaultsColumns: async () => undefined,
  ensureJobApplicationWhatsappColumn: async () => undefined,
  ensureManualApplicationColumns: async () => undefined,
}));

import { countPublicJobs, searchPublicJobs } from "@/lib/jobs/job-posting-db";
import { parseJobSearch } from "@/lib/jobs/job-search";

describe("paginação de vagas públicas", () => {
  beforeEach(() => {
    findMany.mockReset();
    count.mockReset();
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(1096);
  });

  it("countPublicJobs consulta o total sem materializar a lista", async () => {
    const total = await countPublicJobs(parseJobSearch({}));
    expect(total).toBe(1096);
    expect(count).toHaveBeenCalledOnce();
    expect(findMany).not.toHaveBeenCalled();
  });

  it("searchPublicJobs aplica skip/take quando pedidos", async () => {
    await searchPublicJobs(parseJobSearch({}), { skip: 24, take: 12 });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 24,
        take: 12,
      }),
    );
  });

  it("limita take a 200", async () => {
    await searchPublicJobs(parseJobSearch({}), { take: 999 });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 200,
      }),
    );
  });
});
