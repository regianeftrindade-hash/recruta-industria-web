import { describe, expect, it } from "vitest";
import {
  VIDEO_APRESENTACAO_MAX_BYTES,
  VIDEO_APRESENTACAO_MAX_SECONDS,
  contentTypeFromPath,
  extensionForVideoMime,
  isAllowedVideoMime,
  isVideoDurationAllowed,
  mimeFromFileName,
  resolveVideoMime,
} from "@/lib/professional/professional-video";
import {
  buildProfessionalVideoPath,
  isProfessionalVideoPathOwned,
} from "@/lib/professional/professional-video-storage";

describe("MIME e extensão do vídeo de apresentação", () => {
  it("aceita mp4/webm/mov e rejeita outros", () => {
    expect(isAllowedVideoMime("video/mp4")).toBe(true);
    expect(isAllowedVideoMime("video/webm")).toBe(true);
    expect(isAllowedVideoMime("video/quicktime")).toBe(true);
    expect(isAllowedVideoMime("video/avi")).toBe(false);
    expect(isAllowedVideoMime("image/png")).toBe(false);
  });

  it("mapeia extensão e MIME pelo nome do arquivo", () => {
    expect(extensionForVideoMime("video/mp4")).toBe("mp4");
    expect(extensionForVideoMime("video/quicktime")).toBe("mov");
    expect(extensionForVideoMime("video/desconhecido")).toBe("webm");
    expect(mimeFromFileName("clip.MP4")).toBe("video/mp4");
    expect(mimeFromFileName("clip.m4v")).toBe("video/mp4");
    expect(mimeFromFileName("clip.mov")).toBe("video/quicktime");
    expect(mimeFromFileName("clip.webm")).toBe("video/webm");
    expect(mimeFromFileName("clip.txt")).toBeNull();
  });

  it("resolve MIME do arquivo (type ou extensão no celular)", () => {
    expect(resolveVideoMime({ name: "a.bin", type: "video/mp4" })).toBe("video/mp4");
    expect(resolveVideoMime({ name: "a.mov", type: "" })).toBe("video/quicktime");
    expect(
      resolveVideoMime({ name: "a.mp4", type: "application/octet-stream" }),
    ).toBe("video/mp4");
    expect(resolveVideoMime({ name: "a.bin", type: "video/avi" })).toBeNull();
  });

  it("infere Content-Type pelo path no storage", () => {
    expect(contentTypeFromPath("professional-videos/u/x.mov")).toBe("video/quicktime");
    expect(contentTypeFromPath("professional-videos/u/x.webm")).toBe("video/webm");
    expect(contentTypeFromPath("professional-videos/u/x.bin")).toBe("video/mp4");
  });
});

describe("limites de duração e tamanho", () => {
  it("limite de 30s com tolerância de 0,5s", () => {
    expect(VIDEO_APRESENTACAO_MAX_SECONDS).toBe(30);
    expect(VIDEO_APRESENTACAO_MAX_BYTES).toBe(25 * 1024 * 1024);
    expect(isVideoDurationAllowed(null)).toBe(true);
    expect(isVideoDurationAllowed(30)).toBe(true);
    expect(isVideoDurationAllowed(30.5)).toBe(true);
    expect(isVideoDurationAllowed(30.6)).toBe(false);
    expect(isVideoDurationAllowed(0)).toBe(true);
  });
});

describe("path de storage do vídeo", () => {
  it("monta path no prefixo do usuário e valida ownership", () => {
    const path = buildProfessionalVideoPath("user-42", "video/mp4");
    expect(path).toMatch(/^professional-videos\/user-42\/\d+_.+\.mp4$/);
    expect(isProfessionalVideoPathOwned(path, "user-42")).toBe(true);
    expect(isProfessionalVideoPathOwned(path, "outro")).toBe(false);
  });

  it("bloqueia traversal e paths fora do layout esperado", () => {
    expect(
      isProfessionalVideoPathOwned("professional-videos/user-42/../admin/x.mp4", "user-42"),
    ).toBe(false);
    expect(
      isProfessionalVideoPathOwned("professional-videos/user-42/sub/x.mp4", "user-42"),
    ).toBe(false);
    expect(isProfessionalVideoPathOwned("professional-videos/user-42/", "user-42")).toBe(false);
    expect(isProfessionalVideoPathOwned("", "user-42")).toBe(false);
    expect(
      isProfessionalVideoPathOwned("professional-videos/user-42/ok.mp4", "user-42/../x"),
    ).toBe(false);
  });
});
