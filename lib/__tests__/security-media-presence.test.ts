import { describe, expect, it } from "vitest";
import {
  canSignMediaPath,
  extractStoragePath,
  isPublicMediaFolder,
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

  it("documento do próprio e-mail ou empresa autenticada", () => {
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
        path: `documents/outro_email/file.pdf`,
        email: "prof@x.com",
        role: "PROFESSIONAL",
      }),
    ).toBe(false);
    expect(
      canSignMediaPath({
        path: `documents/outro_email/file.pdf`,
        email: "rh@empresa.com",
        role: "COMPANY",
      }),
    ).toBe(true);
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
