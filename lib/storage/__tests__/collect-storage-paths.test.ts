import { describe, expect, it } from "vitest";
import {
  collectStoragePathsFromUnknown,
  professionalVideoFolderPrefix,
  uploadOwnerFolderPrefixes,
} from "@/lib/storage/private-uploads";

describe("collectStoragePathsFromUnknown / prefixes", () => {
  it("extrai paths de formDataJSON", () => {
    const json = JSON.stringify({
      certificados: [{ url: "certificados/user@x.com/1.pdf" }],
      cnhDocumento: "cnh-documentos/user@x.com/cnh.png",
      ignored: "https://example.com/not-storage",
    });
    const paths = collectStoragePathsFromUnknown(json);
    expect(paths).toContain("certificados/user@x.com/1.pdf");
    expect(paths).toContain("cnh-documentos/user@x.com/cnh.png");
  });

  it("monta prefixos de upload e vídeo", () => {
    const prefixes = uploadOwnerFolderPrefixes("User@Example.com");
    expect(prefixes.some((p) => p.startsWith("curriculos/"))).toBe(true);
    expect(prefixes.some((p) => p.startsWith("certificados/"))).toBe(true);
    expect(professionalVideoFolderPrefix("cuid123")).toBe("professional-videos/cuid123");
    expect(professionalVideoFolderPrefix("../x")).toBeNull();
  });
});
