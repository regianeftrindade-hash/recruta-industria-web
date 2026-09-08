import { afterEach, describe, expect, it } from "vitest";
import { isAdmin2faRequired, createAdmin2faToken, verifyAdmin2faToken } from "@/lib/security/admin-2fa-edge";
import {
  generatePasswordResetToken,
  verifyPasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/security/security.server";
import {
  resolveSmtpConfig,
  resolveSmtpFromHeader,
  smtpFailureHint,
  unquoteEnv,
} from "@/lib/infra/email";
import {
  assertInterviewScheduleRules,
  assertInterviewRespondRules,
  formatInterviewComprovante,
} from "@/lib/company/job-proposals-shared";
import { mapTeamInviteError, mapTeamRevokeError } from "@/lib/company/company-team-errors";
import { parseInterviewRating } from "@/lib/interview-ratings";
import { isRuntimeDdlEnabled } from "@/lib/infra/ensure-db-schema";

describe("isAdmin2faRequired", () => {
  it("respeita true/false e default por NODE_ENV", () => {
    expect(isAdmin2faRequired({ ENABLE_ADMIN_2FA: "false" } as NodeJS.ProcessEnv)).toBe(false);
    expect(isAdmin2faRequired({ ENABLE_ADMIN_2FA: "true" } as NodeJS.ProcessEnv)).toBe(true);
    expect(isAdmin2faRequired({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toBe(true);
    expect(isAdmin2faRequired({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toBe(false);
  });
});

describe("cookie 2FA admin", () => {
  it("rejeita token expirado", () => {
    process.env.NEXTAUTH_SECRET = "test-secret-2fa";
    const token = createAdmin2faToken("admin@test.com");
    // Força expiração mexendo no payload
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [email, , sig] = raw.split(":");
    const expired = Buffer.from(`${email}:${Date.now() - 1000}:${sig}`).toString("base64url");
    expect(verifyAdmin2faToken(expired, "admin@test.com")).toBe(false);
    expect(verifyAdmin2faToken(token, "admin@test.com")).toBe(true);
  });
});

describe("password reset em memória", () => {
  it("gera, verifica e consome token", () => {
    const token = generatePasswordResetToken("user@empresa.com");
    expect(verifyPasswordResetToken(token)).toBe("user@empresa.com");
    consumePasswordResetToken(token);
    expect(verifyPasswordResetToken(token)).toBeNull();
    expect(verifyPasswordResetToken("token-invalido")).toBeNull();
  });
});

describe("SMTP resolve", () => {
  it("normaliza host Hostinger, porta 25 e From", () => {
    const cfg = resolveSmtpConfig({
      SMTP_HOST: "mail.hostinger.com",
      SMTP_PORT: "25",
      SMTP_USER: "contato@recrutaindustria.com",
      SMTP_PASS: "  senha  ",
      SMTP_SECURE: "true",
    } as NodeJS.ProcessEnv);
    expect(cfg.host).toBe("smtp.hostinger.com");
    expect(cfg.port).toBe(465);
    expect(cfg.pass).toBe("senha");

    const from = resolveSmtpFromHeader({
      SMTP_USER: "contato@recrutaindustria.com",
      SMTP_FROM: "Outro Nome <outro@dominio.com>",
    } as NodeJS.ProcessEnv);
    expect(from).toContain("contato@recrutaindustria.com");
    expect(unquoteEnv('"com aspas"')).toBe("com aspas");
  });

  it("gera hint útil para 535", () => {
    expect(smtpFailureHint({ responseCode: 535, message: "Invalid login" })).toMatch(/Hostinger recusou o login/i);
  });
});

describe("agendamento de entrevista", () => {
  it("exige link online e endereço presencial", () => {
    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "SENT",
        locationType: "PLATFORM",
      }),
    ).toThrow("PROPOSAL_NOT_SCHEDULABLE");

    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERESTED",
        locationType: "ONLINE",
      }),
    ).toThrow("MEETING_URL_REQUIRED");

    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERESTED",
        locationType: "PRESENTIAL",
      }),
    ).toThrow("ADDRESS_REQUIRED");

    expect(() =>
      assertInterviewScheduleRules({
        proposalStatus: "INTERESTED",
        locationType: "PLATFORM",
      }),
    ).not.toThrow();
  });

  it("só responde entrevista PENDING", () => {
    expect(() => assertInterviewRespondRules("CONFIRMED")).toThrow("INTERVIEW_NOT_PENDING");
    expect(() => assertInterviewRespondRules("PENDING")).not.toThrow();
  });

  it("formata comprovante PLATFORM", () => {
    const c = formatInterviewComprovante({
      companyName: "Metalúrgica X",
      scheduledAt: new Date("2026-09-10T15:00:00.000Z"),
      locationType: "PLATFORM",
      address: null,
      meetingUrl: null,
      observacoes: "",
    });
    expect(c.localLabel).toMatch(/plataforma/i);
    expect(c.text).toContain("Metalúrgica X");
  });
});

describe("equipe e rating", () => {
  it("mapeia erros de convite e remoção", () => {
    expect(mapTeamInviteError("SEAT_LIMIT")?.status).toBe(403);
    expect(mapTeamInviteError("CANNOT_INVITE_SELF")?.status).toBe(400);
    expect(mapTeamInviteError("DESCONHECIDO")).toBeNull();
    expect(mapTeamRevokeError("FORBIDDEN")?.status).toBe(403);
  });

  it("valida rating 1–5", () => {
    expect(parseInterviewRating(3)).toBe(3);
    expect(() => parseInterviewRating(0)).toThrow("INVALID_RATING");
    expect(() => parseInterviewRating(6)).toThrow("INVALID_RATING");
    expect(() => parseInterviewRating("x")).toThrow("INVALID_RATING");
  });
});

describe("runtime DDL flag", () => {
  const prev = process.env.DISABLE_RUNTIME_DDL;
  afterEach(() => {
    if (prev === undefined) delete process.env.DISABLE_RUNTIME_DDL;
    else process.env.DISABLE_RUNTIME_DDL = prev;
  });

  it("DISABLE_RUNTIME_DDL corta DDL no request path", () => {
    delete process.env.DISABLE_RUNTIME_DDL;
    expect(isRuntimeDdlEnabled()).toBe(true);
    process.env.DISABLE_RUNTIME_DDL = "true";
    expect(isRuntimeDdlEnabled()).toBe(false);
  });
});
