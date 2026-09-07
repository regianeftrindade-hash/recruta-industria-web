import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import {
  getCompanySubscriptionKey,
  resolveCompanyActor,
} from "@/lib/company/company-team";

type ChatRow = {
  id: string;
  companyKey: string;
  authorUserId: string;
  authorName: string;
  body: string;
  createdAt: Date;
};

let chatTableReady = false;

async function ensureChatTable() {
  if (chatTableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CompanyChatMessage" (
      "id" TEXT NOT NULL,
      "companyKey" TEXT NOT NULL,
      "authorUserId" TEXT NOT NULL,
      "authorName" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompanyChatMessage_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CompanyChatMessage_companyKey_createdAt_idx" ON "CompanyChatMessage"("companyKey", "createdAt")`,
  );
  chatTableReady = true;
}

async function getCompanyChatContext(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;

  const user = await prisma.user.findUnique({
    where: { email: auth.email },
    include: { company: true },
  });

  if (!user || user.role !== "COMPANY") return null;

  const actor = await resolveCompanyActor(user.id);
  if (!actor) return null;

  const companyKey = getCompanySubscriptionKey(actor.ownerUserId);
  const displayCompany =
    user.company?.name ||
    (actor.ownerUserId !== user.id
      ? (
          await prisma.company.findUnique({
            where: { userId: actor.ownerUserId },
            select: { name: true, responsavelNome: true },
          })
        )?.name
      : null) ||
    "Empresa";

  return {
    user,
    companyKey,
    authorName: user.company?.responsavelNome || user.name || displayCompany || "RH",
  };
}
function mapMessage(row: ChatRow) {
  return {
    id: row.id,
    authorUserId: row.authorUserId,
    authorName: row.authorName,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await getCompanyChatContext(request);
    if (!ctx) {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    await ensureChatTable();
    const rows = await prisma.$queryRaw<ChatRow[]>`
      SELECT * FROM "CompanyChatMessage"
      WHERE "companyKey" = ${ctx.companyKey}
      ORDER BY "createdAt" ASC
      LIMIT 100
    `;

    return NextResponse.json({
      messages: rows.map(mapMessage),
      currentUserId: ctx.user.id,
    });
  } catch (error) {
    console.error("Erro ao listar chat da empresa:", error);
    return NextResponse.json({ error: "Erro ao listar chat" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getCompanyChatContext(request);
    if (!ctx) {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const text = String(body?.message || "").trim().slice(0, 1000);
    if (!text) {
      return NextResponse.json({ error: "Informe a mensagem" }, { status: 400 });
    }

    await ensureChatTable();
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "CompanyChatMessage" (
        id, "companyKey", "authorUserId", "authorName", body, "createdAt"
      ) VALUES (
        ${id}, ${ctx.companyKey}, ${ctx.user.id}, ${ctx.authorName}, ${text}, NOW()
      )
    `;

    const rows = await prisma.$queryRaw<ChatRow[]>`
      SELECT * FROM "CompanyChatMessage"
      WHERE id = ${id}
      LIMIT 1
    `;

    return NextResponse.json({ message: rows[0] ? mapMessage(rows[0]) : null });
  } catch (error) {
    console.error("Erro ao enviar chat da empresa:", error);
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}
