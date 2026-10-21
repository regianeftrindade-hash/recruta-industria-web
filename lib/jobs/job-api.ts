import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { requireAdmin } from "@/lib/auth/admin-auth";
import { prisma } from "@/lib/db";
import { JobPostingError } from "@/lib/jobs/job-posting";

export function jsonError(error: unknown, fallback: string) {
  if (error instanceof JobPostingError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code ?? null,
        alreadyApplied: error.status === 409 && error.code !== "EMAIL_BUSY",
      },
      { status: error.status },
    );
  }

  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function requireAdminUser(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return { denied, userId: null as string | null };

  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) {
    return {
      denied: NextResponse.json({ error: "Não autorizado" }, { status: 401 }),
      userId: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return {
      denied: NextResponse.json({ error: "Conta de administrador não encontrada." }, { status: 401 }),
      userId: null,
    };
  }

  return { denied: null, userId: user.id };
}
