import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];

vi.mock("@/lib/company/company-team", () => ({
  resolveCompanyActor: async () => null,
  ensureCompanyTeamTable: async () => undefined,
}));

vi.mock("@/lib/storage/private-uploads", () => ({
  collectStoragePathsFromUnknown: () => [],
  professionalVideoFolderPrefix: () => null,
  removePrivateFiles: async () => ({ removed: [], failed: [] }),
  removePrivateFilesByPrefixes: async () => ({ removed: [], failed: [] }),
  uploadOwnerFolderPrefixes: () => [],
}));

vi.mock("@/lib/db", () => {
  const track = (name: string) => async () => {
    calls.push(name);
    return { count: 1 };
  };
  return {
    prisma: {
      user: {
        findUnique: async () => ({
          id: "u1",
          email: "prof@example.com",
          profile: {
            id: "p1",
            avatar: null,
            curricoURL: null,
            atestadoURL: null,
            videoApresentacaoPath: null,
            formDataJSON: null,
          },
          company: null,
          professional: { id: "pr1" },
        }),
        delete: async () => {
          calls.push("user.delete");
          return {};
        },
      },
      profile: { delete: async () => { calls.push("profile.delete"); return {}; } },
      professional: { delete: async () => { calls.push("professional.delete"); return {}; } },
      chatMessage: { deleteMany: track("chatMessage") },
      companyChatMessage: { deleteMany: track("companyChatMessage") },
      videoCallInvite: { deleteMany: track("videoCallInvite") },
      videoCallParticipant: { deleteMany: track("videoCallParticipant") },
      videoCallTeamResponse: { deleteMany: track("videoCallTeamResponse") },
      videoCallSignal: { deleteMany: track("videoCallSignal") },
      interview: { deleteMany: track("interview") },
      interviewRating: { deleteMany: track("interviewRating") },
      rating: { deleteMany: track("rating") },
      aiUsageEvent: { deleteMany: track("aiUsageEvent") },
      paymentRecord: {
        findMany: async () => [
          {
            id: "pay1",
            customer: JSON.stringify({ email: "prof@example.com", name: "Prof" }),
          },
        ],
        update: async () => {
          calls.push("paymentRecord.update");
          return {};
        },
      },
    },
  };
});

describe("deleteOwnAccount scrub", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("remove comunicações/telemetria e redige customer de pagamento", async () => {
    const { deleteOwnAccount } = await import("@/lib/account/delete-own-account");
    const result = await deleteOwnAccount("u1");
    expect(result.mode).toBe("professional");
    expect(calls).toEqual(
      expect.arrayContaining([
        "chatMessage",
        "companyChatMessage",
        "videoCallInvite",
        "videoCallSignal",
        "interview",
        "aiUsageEvent",
        "paymentRecord.update",
        "profile.delete",
        "professional.delete",
        "user.delete",
      ]),
    );
    expect(result.storageNotes).toEqual(
      expect.arrayContaining(["comms_telemetry_scrubbed", "payment_records_retained"]),
    );
  });
});
