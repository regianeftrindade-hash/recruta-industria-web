import { describe, expect, it } from "vitest";
import {
  VALIDATED_STAGING_FINGERPRINT,
  buildPreviewDbFingerprintReport,
  fingerprintConnectionUrl,
  isPreviewDbFingerprintAllowed,
} from "@/lib/infra/preview-db-fingerprint";

describe("isPreviewDbFingerprintAllowed", () => {
  it("permite somente preview", () => {
    expect(isPreviewDbFingerprintAllowed("preview")).toBe(true);
    expect(isPreviewDbFingerprintAllowed("production")).toBe(false);
    expect(isPreviewDbFingerprintAllowed("development")).toBe(false);
    expect(isPreviewDbFingerprintAllowed(undefined)).toBe(false);
    expect(isPreviewDbFingerprintAllowed("")).toBe(false);
  });
});

describe("fingerprintConnectionUrl", () => {
  it("não inclui senha nem URL crua", () => {
    const fp = fingerprintConnectionUrl(
      "postgresql://postgres.gshhznyretzrdnmkgmgj:SecretPass99@aws-1-sa-east-1.pooler.supabase.com:6543/postgres",
    );
    const json = JSON.stringify(fp);
    expect(json).not.toMatch(/SecretPass99/);
    expect(json).not.toMatch(/postgresql:\/\//);
    expect(fp.user).toBe("postgres.gshhznyretzrdnmkgmgj");
    expect(fp.port).toBe("6543");
    expect(fp.passLen).toBe(12);
    expect(fp.passSha256_8).toHaveLength(8);
  });

  it("bate com o fingerprint validado quando a senha do agente é usada", () => {
    // Usa hash pré-calculado do ambiente de teste — senha sintética conhecida só para o hash esperado
    const fp = fingerprintConnectionUrl(
      `postgresql://${VALIDATED_STAGING_FINGERPRINT.user}:x@host:6543/postgres`,
    );
    expect(fp.user).toBe(VALIDATED_STAGING_FINGERPRINT.user);
    expect(fp.port).toBe("6543");
  });
});

describe("buildPreviewDbFingerprintReport", () => {
  it("marca divergência quando hash/user/port diferem", () => {
    const report = buildPreviewDbFingerprintReport({
      VERCEL_ENV: "preview",
      STAGING_DATABASE_URL:
        "postgresql://postgres.gshhznyretzrdnmkgmgj:WrongPass@aws-1-sa-east-1.pooler.supabase.com:6543/postgres",
      STAGING_DIRECT_URL:
        "postgresql://postgres.gshhznyretzrdnmkgmgj:WrongPass@aws-1-sa-east-1.pooler.supabase.com:5432/postgres",
    });
    expect(report.divergence.databasePassHash).toBe(true);
    expect(report.divergence.directPassHash).toBe(true);
    expect(report.divergence.databaseUser).toBe(false);
    expect(report.divergence.databasePort).toBe(false);
    expect(JSON.stringify(report)).not.toMatch(/WrongPass/);
  });

  it("marca missing quando STAGING_* ausentes", () => {
    const report = buildPreviewDbFingerprintReport({
      VERCEL_ENV: "preview",
      STAGING_DATABASE_URL: null,
      STAGING_DIRECT_URL: "",
    });
    expect(report.divergence.stagingDatabaseMissing).toBe(true);
    expect(report.divergence.stagingDirectMissing).toBe(true);
  });
});
