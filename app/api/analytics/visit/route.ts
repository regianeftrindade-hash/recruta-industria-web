import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = String(body.path || '/').slice(0, 300);
    const referrer = body.referrer ? String(body.referrer).slice(0, 500) : null;
    const sessionId = body.sessionId ? String(body.sessionId).slice(0, 80) : null;

    if (path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    await prisma.$executeRaw`
      INSERT INTO "SiteVisit" (id, path, referrer, "sessionId", "createdAt")
      VALUES (${randomUUID()}, ${path}, ${referrer}, ${sessionId}, NOW())
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao registrar visita:', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
