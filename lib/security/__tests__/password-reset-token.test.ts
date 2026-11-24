import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<
  string,
  { email: string; tokenHash: string; expiresAt: Date; usedAt: Date | null }
>();

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: async (ops: Array<Promise<unknown>>) => Promise.all(ops),
    passwordResetToken: {
      updateMany: async ({
        where,
        data,
      }: {
        where: { email?: string; tokenHash?: string; usedAt?: null; expiresAt?: { gt: Date } };
        data: { usedAt: Date };
      }) => {
        let count = 0;
        for (const [hash, row] of store) {
          if (where.email && row.email !== where.email) continue;
          if (where.tokenHash && row.tokenHash !== where.tokenHash) continue;
          if (where.usedAt === null && row.usedAt !== null) continue;
          if (where.expiresAt?.gt && row.expiresAt <= where.expiresAt.gt) continue;
          store.set(hash, { ...row, usedAt: data.usedAt });
          count += 1;
        }
        return { count };
      },
      create: async ({
        data,
      }: {
        data: { email: string; tokenHash: string; expiresAt: Date };
      }) => {
        store.set(data.tokenHash, {
          email: data.email,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          usedAt: null,
        });
        return data;
      },
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        return store.get(where.tokenHash) ?? null;
      },
    },
  },
}));

describe("password-reset-token (persistido)", () => {
  beforeEach(() => {
    store.clear();
  });

  it("emite, verifica e consome uma única vez", async () => {
    const {
      generatePasswordResetToken,
      verifyPasswordResetToken,
      consumePasswordResetToken,
    } = await import("@/lib/security/password-reset-token");

    const token = await generatePasswordResetToken("User@Empresa.com");
    expect(await verifyPasswordResetToken(token)).toBe("user@empresa.com");
    expect(await consumePasswordResetToken(token)).toBe("user@empresa.com");
    expect(await verifyPasswordResetToken(token)).toBeNull();
    expect(await consumePasswordResetToken(token)).toBeNull();
  });

  it("invalida tokens anteriores do mesmo e-mail", async () => {
    const { generatePasswordResetToken, verifyPasswordResetToken } = await import(
      "@/lib/security/password-reset-token"
    );
    const first = await generatePasswordResetToken("a@b.com");
    const second = await generatePasswordResetToken("a@b.com");
    expect(await verifyPasswordResetToken(first)).toBeNull();
    expect(await verifyPasswordResetToken(second)).toBe("a@b.com");
  });

  it("rejeita token inexistente", async () => {
    const { verifyPasswordResetToken } = await import("@/lib/security/password-reset-token");
    expect(await verifyPasswordResetToken("nao-existe")).toBeNull();
  });
});
