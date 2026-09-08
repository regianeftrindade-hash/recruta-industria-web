import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";

const INTERVIEW_TYPES = [
  "interview_confirmed_by_professional",
  "interview_declined_by_professional",
] as const;

/** Lista avisos da empresa (confirmação/recusa de entrevista). */
export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      select: { id: true, role: true },
    });
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const unreadOnly = request.nextUrl.searchParams.get("unread") !== "0";
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        type: { in: [...INTERVIEW_TYPES] },
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        createdAt: true,
        metadata: true,
      },
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        href: n.href,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
        confirmed: n.type === "interview_confirmed_by_professional",
        metadata: n.metadata,
      })),
    });
  } catch (error) {
    console.error("[company/notifications GET]", error);
    return NextResponse.json({ error: "Erro ao listar avisos" }, { status: 500 });
  }
}

/** Marca avisos como lidos (ids[] ou all=1). */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      select: { id: true, role: true },
    });
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      ids?: string[];
      all?: boolean;
    };

    if (body.all) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          type: { in: [...INTERVIEW_TYPES] },
          readAt: null,
        },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "ids obrigatório" }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        id: { in: ids },
        type: { in: [...INTERVIEW_TYPES] },
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[company/notifications PATCH]", error);
    return NextResponse.json({ error: "Erro ao atualizar avisos" }, { status: 500 });
  }
}
