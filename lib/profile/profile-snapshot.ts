import { prisma } from '@/lib/db';

export async function saveProfileFormSnapshot(
  userId: string,
  formDataJSON: string | null
): Promise<void> {
  if (!formDataJSON) return;

  await prisma.$executeRaw`
    UPDATE "Profile"
    SET "formDataJSON" = ${formDataJSON}, "updatedAt" = NOW()
    WHERE "userId" = ${userId}
  `;
}

export async function getProfileFormSnapshot(
  userId: string
): Promise<string | null> {
  const rows = await prisma.$queryRaw<Array<{ formDataJSON: string | null }>>`
    SELECT "formDataJSON" FROM "Profile" WHERE "userId" = ${userId} LIMIT 1
  `;

  return rows[0]?.formDataJSON ?? null;
}
