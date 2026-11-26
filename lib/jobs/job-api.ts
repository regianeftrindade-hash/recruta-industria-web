import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { requireAdmin } from "@/lib/auth/admin-auth";
import { prisma } from "@/lib/db";
import { JobPostingError } from "@/lib/jobs/job-posting";

/** Extrai indício seguro de drift de schema (sem senhas/SQL completo). */
export function schemaDriftFromUnknown(error: unknown): {
  code: "SCHEMA_DRIFT";
  prismaCode: string;
  column: string | null;
} | null {
  if (!error || typeof error !== "object") return null;
  const err = error as { code?: unknown; message?: unknown; meta?: { column?: unknown } };
  const prismaCode = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";
  const metaColumn = typeof err.meta?.column === "string" ? err.meta.column : null;
  const fromMessage = message.match(/column [`']?([\w."]+(?:\.[\w."]+)?)[`']? does not exist/i)?.[1] ?? null;
  const column = metaColumn || fromMessage;
  if (prismaCode === "P2022" || /does not exist/i.test(message)) {
    return { code: "SCHEMA_DRIFT", prismaCode: prismaCode || "P2022", column };
  }
  return null;
}

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
  const drift = schemaDriftFromUnknown(error);
  if (drift) {
    return NextResponse.json(
      {
        error: fallback,
        code: drift.code,
        prismaCode: drift.prismaCode,
        column: drift.column,
      },
      { status: 500 },
    );
  }
  const message = error && typeof error === "object" && "message" in error
    ? String((error as { message?: unknown }).message || "")
    : "";
  const prismaCode =
    error && typeof error === "object" && typeof (error as { code?: unknown }).code === "string"
      ? String((error as { code: string }).code)
      : null;
  if (/Environment variable not found:\s*DATABASE_URL/i.test(message)) {
    return NextResponse.json(
      { error: fallback, code: "DATABASE_URL_MISSING" },
      { status: 500 },
    );
  }
  if (prismaCode && /^P\d{4}$/.test(prismaCode)) {
    return NextResponse.json(
      { error: fallback, code: "PRISMA_ERROR", prismaCode },
      { status: 500 },
    );
  }
  if (/Can't reach database server/i.test(message)) {
    return NextResponse.json(
      { error: fallback, code: "DB_UNREACHABLE" },
      { status: 500 },
    );
  }
  const errorName = error instanceof Error ? error.name : "";
  if (
    errorName === "PrismaClientInitializationError" ||
    /PrismaClientInitializationError/i.test(message) ||
    /Error opening a TLS connection/i.test(message) ||
    /P1001|P1011/i.test(message)
  ) {
    // Não vaza nome/mensagem Prisma ao cliente; logs do servidor já registram.
    return NextResponse.json(
      { error: fallback, code: "DB_INIT_FAILED" },
      { status: 500 },
    );
  }
  return NextResponse.json(
    {
      error: fallback,
      code: "INTERNAL",
      errorName: error instanceof Error ? error.name : null,
    },
    { status: 500 },
  );
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
