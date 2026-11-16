import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const queryRaw = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUnique(...args) },
    $queryRawUnsafe: (...args: unknown[]) => queryRaw(...args),
    $executeRawUnsafe: vi.fn(),
  },
}));

vi.mock("@/lib/infra/ensure-db-schema", () => ({
  isRuntimeDdlEnabled: () => false,
}));

import {
  getUserNotificationPreferences,
  isMissingCountryColumnError,
} from "@/lib/notifications/preferences";

describe("telefone das notificações sem a coluna de país", () => {
  beforeEach(() => {
    findUnique.mockReset();
    queryRaw.mockReset();
    queryRaw.mockResolvedValue([]);
  });

  it("reconhece só a ausência de countryCode", () => {
    expect(isMissingCountryColumnError({
      code: "P2022",
      message: "The column User.countryCode does not exist",
    })).toBe(true);
    expect(isMissingCountryColumnError({
      code: "P1001",
      message: "Can't reach database server",
    })).toBe(false);
  });

  it("assume Brasil quando a coluna não existe e propaga outra falha", async () => {
    findUnique
      .mockRejectedValueOnce({
        code: "P2022",
        message: "The column Profile.countryCode does not exist",
      })
      .mockResolvedValueOnce({
        role: "PROFESSIONAL",
        profile: { phone: "11988887777", whatsapp: null },
        company: null,
      });

    const prefs = await getUserNotificationPreferences("user-1");
    expect(prefs.resolvedPhoneE164).toBe("5511988887777");
    expect(findUnique).toHaveBeenCalledTimes(2);

    findUnique.mockRejectedValueOnce({
      code: "P1001",
      message: "Can't reach database server",
    });
    await expect(getUserNotificationPreferences("user-1")).rejects.toMatchObject({
      code: "P1001",
    });
  });
});
