import { describe, expect, it } from "vitest";
import {
  MANUAL_APPLICATION_JOB_ID,
  MANUAL_APPLICATION_MESSAGE,
  manualApplicationMessage,
} from "@/lib/jobs/manual-application-notice";

describe("manualApplicationMessage", () => {
  it("mostra o aviso só na vaga marcada", () => {
    expect(manualApplicationMessage(MANUAL_APPLICATION_JOB_ID)).toBe(MANUAL_APPLICATION_MESSAGE);
    expect(manualApplicationMessage("cmvl51soy0004139oj4hijxmw")).toBeNull();
    expect(manualApplicationMessage(null)).toBeNull();
  });
});
