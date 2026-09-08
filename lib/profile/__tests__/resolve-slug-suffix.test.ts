import { describe, expect, it } from "vitest";
import { buildProfilePublicSlug } from "@/lib/profile/public-slug";

describe("resolve slug suffix", () => {
  it("sufixo do slug bate com o final do cuid", () => {
    const id = "cmr8emjil0002zgih5rpok51e";
    const slug = buildProfilePublicSlug({
      id,
      cargo: "Soldador TIG",
      city: "São Paulo",
      state: "SP",
    });
    expect(slug.endsWith("pok51e")).toBe(true);
    expect(id.endsWith("pok51e")).toBe(true);
  });
});
