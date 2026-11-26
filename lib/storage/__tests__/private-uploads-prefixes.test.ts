import { describe, expect, it, vi, beforeEach } from "vitest";

const list = vi.fn();
const remove = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: () => ({ list, remove }),
    },
  }),
}));

describe("removePrivateFilesByPrefixes pagination", () => {
  beforeEach(() => {
    list.mockReset();
    remove.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
  });

  it("pagina além de 1000 arquivos e remove em lotes", async () => {
    const { removePrivateFilesByPrefixes } = await import(
      "@/lib/storage/private-uploads"
    );

    const page1 = Array.from({ length: 1000 }, (_, i) => ({ name: `f${i}.pdf` }));
    const page2 = [{ name: "last.pdf" }];
    list.mockResolvedValueOnce({ data: page1, error: null });
    list.mockResolvedValueOnce({ data: page2, error: null });
    remove.mockResolvedValue({ error: null });

    const result = await removePrivateFilesByPrefixes(["curriculos/user1"]);

    expect(list).toHaveBeenCalledTimes(2);
    expect(list.mock.calls[0][1]).toMatchObject({ limit: 1000, offset: 0 });
    expect(list.mock.calls[1][1]).toMatchObject({ limit: 1000, offset: 1000 });
    expect(remove).toHaveBeenCalledTimes(2);
    expect(result.removed).toHaveLength(1001);
    expect(result.failed).toHaveLength(0);
  });
});
