import { describe, expect, it } from "vitest";
import {
  MANUAL_APPLICATION_CARE_OF,
  MANUAL_APPLICATION_JOB_ID,
  MANUAL_APPLICATION_MESSAGE,
  MANUAL_APPLICATION_RESUME_MESSAGE,
  manualApplicationCareOf,
  manualApplicationMessage,
} from "@/lib/jobs/manual-application-notice";

describe("manualApplicationMessage", () => {
  it("mostra o aviso só na vaga marcada", () => {
    expect(manualApplicationMessage(MANUAL_APPLICATION_JOB_ID)).toBe(MANUAL_APPLICATION_MESSAGE);
    expect(manualApplicationMessage("cmvl51soy0004139oj4hijxmw")).toBeNull();
    expect(manualApplicationMessage(null)).toBeNull();
  });

  it("guarda o envio aos cuidados de Maria só nesta vaga", () => {
    expect(manualApplicationCareOf(MANUAL_APPLICATION_JOB_ID)).toBe(MANUAL_APPLICATION_CARE_OF);
    expect(MANUAL_APPLICATION_CARE_OF).toBe("Maria");
    expect(manualApplicationCareOf("cmvl51soy0004139oj4hijxmw")).toBeNull();
  });

  it("pede cadastro completo e currículo em PDF", () => {
    expect(MANUAL_APPLICATION_RESUME_MESSAGE).toMatch(/cadastro completo/i);
    expect(MANUAL_APPLICATION_RESUME_MESSAGE).toMatch(/r[aá]pido/i);
    expect(MANUAL_APPLICATION_RESUME_MESSAGE).toMatch(/PDF/);
    expect(MANUAL_APPLICATION_RESUME_MESSAGE).not.toMatch(/DOCX/);
  });
});
