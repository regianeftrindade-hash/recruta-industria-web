import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import {
  gerarResultado,
  parseTesteComportamentalJSON,
  serializeTesteComportamental,
  TOTAL_PERGUNTAS_TESTE,
  validarRespostas,
} from "@/lib/teste-comportamental";
import { lerCampoJsonDoPerfil, salvarCampoJsonNoPerfil } from "@/lib/profile-json-fields";

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
      return NextResponse.json({ completed: false, resultado: null });
    }

    const raw = await lerCampoJsonDoPerfil(user.id, "testeComportamentalJSON");
    const resultado = parseTesteComportamentalJSON(raw);

    return NextResponse.json({
      completed: !!resultado,
      resultado,
    });
  } catch (error) {
    console.error("Erro ao buscar teste comportamental:", error);
    return NextResponse.json({ error: "Erro ao buscar teste" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (!user.profile) {
      return NextResponse.json(
        { error: "Complete seu cadastro antes de fazer o teste comportamental." },
        { status: 404 }
      );
    }

    const existente = await lerCampoJsonDoPerfil(user.id, "testeComportamentalJSON");
    if (parseTesteComportamentalJSON(existente)) {
      return NextResponse.json(
        { error: "O teste comportamental já foi preenchido e não pode ser refeito." },
        { status: 409 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
    }

    const respostas = validarRespostas(
      body && typeof body === "object" && "respostas" in body
        ? (body as { respostas: unknown }).respostas
        : body
    );

    if (!respostas) {
      return NextResponse.json(
        { error: `Responda todas as ${TOTAL_PERGUNTAS_TESTE} perguntas com notas de 1 (discordo plenamente) a 5 (concordo plenamente).` },
        { status: 400 }
      );
    }

    const resultado = gerarResultado(respostas);
    const json = serializeTesteComportamental(resultado);

    await salvarCampoJsonNoPerfil(user.id, "testeComportamentalJSON", json);

    const salvo = await lerCampoJsonDoPerfil(user.id, "testeComportamentalJSON");
    const confirmado = parseTesteComportamentalJSON(salvo) ?? resultado;

    return NextResponse.json({ success: true, resultado: confirmado });
  } catch (error) {
    console.error("Erro ao salvar teste comportamental:", error);
    const detail = error instanceof Error ? error.message : "erro desconhecido";
    return NextResponse.json(
      {
        error: "Erro ao salvar teste. Reinicie o servidor e tente novamente.",
        detail: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 }
    );
  }
}
