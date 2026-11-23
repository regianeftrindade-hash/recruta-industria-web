import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const remove = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        remove,
      }),
    },
  }),
}));

describe("removePrivateFiles", () => {
  const ORIGINAL = { ...process.env };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    remove.mockReset();
    remove.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in ORIGINAL)) delete process.env[key];
    }
    Object.assign(process.env, ORIGINAL);
    vi.resetModules();
  });

  it("normaliza paths e chama remove do bucket", async () => {
    const { removePrivateFiles } = await import("@/lib/storage/private-uploads");
    const result = await removePrivateFiles([
      "curriculos/user@x.com/cv.pdf",
      "",
      "curriculos/user@x.com/cv.pdf",
      "../evil",
    ]);
    expect(remove).toHaveBeenCalledWith(["curriculos/user@x.com/cv.pdf"]);
    expect(result.removed).toEqual(["curriculos/user@x.com/cv.pdf"]);
    expect(result.failed).toEqual([]);
  });
});
