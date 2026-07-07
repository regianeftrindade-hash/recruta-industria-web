import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import {
  parseSobreMimJSON,
  serializeSobreMim,
  type SobreMimData,
} from "@/lib/sobre-mim";
import { lerCampoJsonDoPerfil, salvarCampoJsonNoPerfil } from "@/lib/profile-json-fields";

function normalizeBody(body: unknown): SobreMimData | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  return {
    hobbys: String(b.hobbys ?? ""),
    estiloMusical: String(b.estiloMusical ?? ""),
    livros: String(b.livros ?? ""),
    filmesSeries: String(b.filmesSeries ?? ""),
    fraseQueDefine: String(b.fraseQueDefine ?? ""),
    assuntosInteresse: String(b.assuntosInteresse ?? ""),
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      include: { profile: true },
    });

    if (!user?.profile) {
      return NextResponse.json({ sobreMim: parseSobreMimJSON(null) });
    }

    const raw = await lerCampoJsonDoPerfil(user.id, "sobreMimJSON");

    return NextResponse.json({
      sobreMim: parseSobreMimJSON(raw),
    });
  } catch (error) {
    console.error("Erro ao buscar sobre mim:", error);
    return NextResponse.json({ error: "Erro ao buscar sobre mim" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
    }

    const sobreMim = normalizeBody(body);
    if (!sobreMim) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (!user.profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const json = serializeSobreMim(sobreMim);
    await salvarCampoJsonNoPerfil(user.id, "sobreMimJSON", json);

    const salvo = await lerCampoJsonDoPerfil(user.id, "sobreMimJSON");

    return NextResponse.json({ success: true, sobreMim: parseSobreMimJSON(salvo ?? json) });
  } catch (error) {
    console.error("Erro ao salvar sobre mim:", error);
    const detail = error instanceof Error ? error.message : "erro desconhecido";
    return NextResponse.json(
      {
        error: "Erro ao salvar sobre mim",
        detail: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 }
    );
  }
}
