import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobPostingError } from "@/lib/jobs/job-posting";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    jobPosting: { findFirst: vi.fn() },
    jobApplication: {
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    $executeRawUnsafe: vi.fn(),
  },
}));

vi.mock("@/lib/professional/professional-storage", () => ({
  getProfessionalPlanTier: vi.fn(),
}));

vi.mock("@/lib/jobs/job-application-mail", () => ({
  APPLICATION_EMAIL_SUCCESS: "Candidatura enviada com sucesso! Seu currículo foi encaminhado para o processo seletivo desta vaga.",
  sendJobApplicationEmail: vi.fn(),
  loadOwnedResume: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { loadOwnedResume, sendJobApplicationEmail } from "@/lib/jobs/job-application-mail";
import { registerJobApplication } from "@/lib/jobs/job-posting-db";
import { getProfessionalPlanTier } from "@/lib/professional/professional-storage";

const db = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  jobPosting: { findFirst: ReturnType<typeof vi.fn> };
  jobApplication: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  $executeRawUnsafe: ReturnType<typeof vi.fn>;
};

const jobId = "job12345678";
const user = {
  id: "user-1",
  name: "Ana Souza",
  email: "ana@example.invalid",
  role: "PROFESSIONAL",
  professional: { id: "pro-1" },
  company: null,
  profile: { id: "profile-1", curricoURL: "curriculos/ana@example.invalid/10_cv.pdf" },
};

function job(mode: string, extra: Record<string, unknown> = {}) {
  return {
    id: jobId,
    title: "Soldador",
    applicationMode: mode,
    applicationEmail: "rh@empresa.example",
    ...extra,
  };
}

describe("envio da candidatura no servidor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$executeRawUnsafe.mockResolvedValue(0);
    db.user.findUnique.mockResolvedValue(user);
    db.jobApplication.create.mockResolvedValue({ id: "app-1" });
    db.jobApplication.updateMany.mockResolvedValue({ count: 1 });
    getProfessionalPlanTier.mockResolvedValue("FREE");
  });

  it("recusa o Free que tenta o envio automático por e-mail", async () => {
    db.jobPosting.findFirst.mockResolvedValue(job("EMAIL"));
    await expect(registerJobApplication(jobId, user.email)).rejects.toMatchObject({
      code: "PREMIUM_REQUIRED",
      status: 403,
    });
    expect(sendJobApplicationEmail).not.toHaveBeenCalled();
    expect(loadOwnedResume).not.toHaveBeenCalled();
    expect(db.jobApplication.create).not.toHaveBeenCalled();
  });

  it("não envia e-mail Premium sem currículo válido", async () => {
    db.jobPosting.findFirst.mockResolvedValue(job("EMAIL"));
    getProfessionalPlanTier.mockResolvedValue("PREMIUM");
    loadOwnedResume.mockRejectedValue(new JobPostingError("Para o envio automático, anexe um currículo em PDF ou DOCX ao seu perfil.", 400, "RESUME_REQUIRED"));
    await expect(registerJobApplication(jobId, user.email)).rejects.toMatchObject({ code: "RESUME_REQUIRED" });
    expect(sendJobApplicationEmail).not.toHaveBeenCalled();
    expect(db.jobApplication.create).not.toHaveBeenCalled();
  });

  it("confirma o e-mail Premium só depois que o envio é aceito", async () => {
    db.jobPosting.findFirst.mockResolvedValue(job("EMAIL"));
    getProfessionalPlanTier.mockResolvedValue("PREMIUM");
    loadOwnedResume.mockResolvedValue({
      bytes: Buffer.from("%PDF-1.7"),
      format: "pdf",
      filename: "curriculo.pdf",
      contentType: "application/pdf",
    });
    db.jobApplication.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "app-1",
        jobId,
        userId: user.id,
        profileId: user.profile.id,
        createdAt: new Date("2026-10-23T12:00:00.000Z"),
        emailStatus: "SENT",
      });
    sendJobApplicationEmail.mockResolvedValue({ ok: true });

    const saved = await registerJobApplication(jobId, user.email);
    expect(saved.message).toMatch(/enviada com sucesso/i);
    expect(sendJobApplicationEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "rh@empresa.example",
      resumeFormat: "pdf",
    }));
    expect(db.jobApplication.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ emailStatus: "SENT" }),
    }));
  });

  it("anexa DOCX quando o currículo salvo é DOCX", async () => {
    db.jobPosting.findFirst.mockResolvedValue(job("EMAIL"));
    getProfessionalPlanTier.mockResolvedValue("PREMIUM");
    loadOwnedResume.mockResolvedValue({
      bytes: Buffer.from("PK"),
      format: "docx",
      filename: "curriculo.docx",
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    db.jobApplication.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "app-1",
        jobId,
        userId: user.id,
        profileId: user.profile.id,
        createdAt: new Date("2026-10-23T12:00:00.000Z"),
        emailStatus: "SENT",
      });
    sendJobApplicationEmail.mockResolvedValue({ ok: true });

    await registerJobApplication(jobId, user.email);
    expect(sendJobApplicationEmail).toHaveBeenCalledWith(expect.objectContaining({
      resumeFormat: "docx",
    }));
  });

  it("marca falha quando o serviço de e-mail recusa o envio", async () => {
    db.jobPosting.findFirst.mockResolvedValue(job("EMAIL"));
    getProfessionalPlanTier.mockResolvedValue("PREMIUM");
    loadOwnedResume.mockResolvedValue({
      bytes: Buffer.from("%PDF-1.7"),
      format: "pdf",
      filename: "curriculo.pdf",
      contentType: "application/pdf",
    });
    db.jobApplication.findUnique.mockResolvedValueOnce(null);
    sendJobApplicationEmail.mockResolvedValue({ ok: false, error: "Não foi possível enviar a candidatura agora. Tente novamente mais tarde." });

    await expect(registerJobApplication(jobId, user.email)).rejects.toMatchObject({ status: 502 });
    expect(db.jobApplication.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { emailStatus: "FAILED" },
    }));
  });

  it("não simula envio de WhatsApp nem de site externo", async () => {
    db.jobPosting.findFirst.mockResolvedValue(job("WHATSAPP"));
    await expect(registerJobApplication(jobId, user.email)).rejects.toMatchObject({ code: "MANUAL_CHANNEL" });

    db.jobPosting.findFirst.mockResolvedValue(job("EXTERNAL"));
    await expect(registerJobApplication(jobId, user.email)).rejects.toMatchObject({ code: "MANUAL_CHANNEL" });
    expect(sendJobApplicationEmail).not.toHaveBeenCalled();
    expect(db.jobApplication.create).not.toHaveBeenCalled();
  });

  it("mantém a candidatura interna do Free sem currículo", async () => {
    db.jobPosting.findFirst.mockResolvedValue(job("INTERNAL", { applicationEmail: null }));
    db.jobApplication.create.mockResolvedValue({ id: "app-1" });
    db.jobApplication.findUnique.mockResolvedValue({
      id: "app-1",
      jobId,
      userId: user.id,
      profileId: user.profile.id,
      createdAt: new Date("2026-10-23T12:00:00.000Z"),
    });

    const saved = await registerJobApplication(jobId, user.email);
    expect(saved.message).toBe("Candidatura registrada.");
    expect(sendJobApplicationEmail).not.toHaveBeenCalled();
    expect(loadOwnedResume).not.toHaveBeenCalled();
    expect(getProfessionalPlanTier).not.toHaveBeenCalled();
  });
});
