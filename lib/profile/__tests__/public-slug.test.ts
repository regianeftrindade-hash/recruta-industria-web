import { describe, expect, it } from "vitest";
import { buildProfilePublicSlug, companyProfessionalPath, slugifyPart } from "@/lib/profile/public-slug";

describe("public-slug", () => {
  it("slugify remove acentos e espaços", () => {
    expect(slugifyPart("São Paulo")).toBe("sao-paulo");
    expect(slugifyPart("Soldador TIG")).toBe("soldador-tig");
  });

  it("monta slug legível com sufixo curto do id", () => {
    const slug = buildProfilePublicSlug({
      id: "cmr8emjil0002zgih5rpok51e",
      cargo: "Soldador TIG",
      city: "São Paulo",
      state: "SP",
    });
    expect(slug).toBe("soldador-tig-sao-paulo-sp-pok51e");
    expect(slug.includes("cmr8emjil")).toBe(false);
  });

  it("companyProfessionalPath abre sempre pelo id interno", () => {
    expect(companyProfessionalPath("soldador-sp-ok51e", "cmr8emjil0002zgih5rpok51e")).toBe(
      "/company/professional/cmr8emjil0002zgih5rpok51e",
    );
    expect(companyProfessionalPath("cmr8emjil0002zgih5rpok51e")).toBe(
      "/company/professional/cmr8emjil0002zgih5rpok51e",
    );
  });
});
