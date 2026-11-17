import { describe, expect, it } from "vitest";
import {
  canSignMediaPath,
  extractStoragePath,
  isPublicMediaFolder,
  companyDocumentHref,
  mediaPathMatchesStoredFile,
  sanitizeUploadOwnerPrefix,
} from "@/lib/storage/private-uploads";
import { isOnlineFromLastSeen, ONLINE_THRESHOLD_MS } from "@/lib/presence";
import { validatePasswordStrength as scorePw } from "@/lib/security/password-strength";
import { validatePasswordStrength as securityPw } from "@/lib/security/security";

describe("private media ACL", () => {
  it("libera pastas públicas e bloqueia traversal", () => {
    expect(isPublicMediaFolder("avatars/x.png")).toBe(true);
    expect(canSignMediaPath({ path: "avatars/x.png" })).toBe(true);
    expect(canSignMediaPath({ path: "../secret", email: "a@b.com" })).toBe(false);
  });

  it("vídeo profissional só do dono ou admin", () => {
    expect(
      canSignMediaPath({
        path: "professional-videos/user-1/clip.mp4",
        email: "a@b.com",
        userId: "user-1",
      }),
    ).toBe(true);
    expect(
      canSignMediaPath({
        path: "professional-videos/user-1/clip.mp4",
        email: "a@b.com",
        userId: "outro",
      }),
    ).toBe(false);
    expect(
      canSignMediaPath({
        path: "professional-videos/user-1/clip.mp4",
        email: "a@b.com",
        isAdmin: true,
      }),
    ).toBe(true);
  });

  it("documento só do próprio e-mail, inclusive empresa", () => {
    const email = "contato@empresa.com";
    const prefix = sanitizeUploadOwnerPrefix(email);
    expect(
      canSignMediaPath({
        path: `documents/${prefix}/file.pdf`,
        email,
        role: "PROFESSIONAL",
      }),
    ).toBe(true);
    expect(
      canSignMediaPath({
        path: `curriculos/${prefix}/file.pdf`,
        email,
        role: "COMPANY",
      }),
    ).toBe(true);
    expect(
      canSignMediaPath({
        path: `documents/outro_email/file.pdf`,
        email: "prof@x.com",
        role: "PROFESSIONAL",
      }),
    ).toBe(false);
    expect(
      canSignMediaPath({
        path: `curriculos/outro_email/file.pdf`,
        email: "rh@empresa.com",
        role: "COMPANY",
      }),
    ).toBe(false);
    expect(
      mediaPathMatchesStoredFile(
        "curriculos/ana/cv.pdf",
        "https://projeto.supabase.co/storage/v1/object/sign/uploads/curriculos/ana/cv.pdf?token=1",
      ),
    ).toBe(true);
    expect(mediaPathMatchesStoredFile("curriculos/outra/cv.pdf", "curriculos/ana/cv.pdf")).toBe(false);
    expect(companyDocumentHref("curriculos/ana/cv.pdf")).toBe(
      "/api/media/sign?path=curriculos%2Fana%2Fcv.pdf&redirect=1",
    );
    expect(companyDocumentHref("https://evil.example/curriculos/ana/cv.pdf")).toBeNull();
  });

  it("extractStoragePath em path relativo", () => {
    expect(extractStoragePath("documents/a/b.pdf")).toBe("documents/a/b.pdf");
  });
});

describe("presence", () => {
  it("online dentro do limiar", () => {
    expect(isOnlineFromLastSeen(new Date())).toBe(true);
    expect(isOnlineFromLastSeen(new Date(Date.now() - ONLINE_THRESHOLD_MS - 1000))).toBe(false);
    expect(isOnlineFromLastSeen(null)).toBe(false);
  });
});

describe("password policy unificada", () => {
  it("reset e cadastro concordam em isStrong", () => {
    const weak = "Abcdef1!"; // 8 chars, sem 12 — score pode variar
    const strong = "Abcdefgh1!xy";
    expect(scorePw(strong).isStrong).toBe(securityPw(strong).isStrong);
    expect(scorePw("123456").isStrong).toBe(false);
    expect(securityPw("123456").isStrong).toBe(false);
    expect(securityPw(weak).isStrong).toBe(scorePw(weak).isStrong);
  });
});
