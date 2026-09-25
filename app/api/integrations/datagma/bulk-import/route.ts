import { NextRequest, NextResponse } from "next/server";
import {
  extractSearchPeople,
  readDatagmaPersonEmail,
  searchDatagmaPeople,
} from "@/lib/integrations/datamagnet-client";
import {
  emailInternoTemporario,
  insertDatagmaProfile,
  validateDatamagnetIngestKey,
  type DatamagnetProfileInput,
} from "@/lib/integrations/datamagnet-profile";
import { sanitizeInput } from "@/lib/security/security";

const MAX_PERFIS = 3;

export const maxDuration = 60;

function readIngestKey(request: NextRequest): string | null {
  const header = request.headers.get("x-api-key")?.trim();
  if (header) return header;

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function readText(value: unknown): string {
  return typeof value === "string" ? sanitizeInput(value) : "";
}

function toInput(
  person: Record<string, unknown>,
  email: string,
  keyword: string,
  location: string,
): DatamagnetProfileInput | null {
  const nome =
    readText(person.full_name) ||
    readText(person.name) ||
    [readText(person.firstname), readText(person.firstName), readText(person.lastName)]
      .filter(Boolean)
      .join(" ");
  if (nome.length < 2) return null;

  const cargo =
    readText(person.jobTitle) ||
    readText(person.title) ||
    readText(person.headline) ||
    keyword;
  const cargoFinal = cargo.length >= 2 ? cargo : keyword;
  const empresa = readText(person.company) || "Indústria";
  const local = readText(person.location) || location;
  const skills = Array.isArray(person.skills)
    ? person.skills.filter((item): item is string => typeof item === "string")
    : [];
  const habilidades = skills.map((item) => sanitizeInput(item)).filter(Boolean).slice(0, 30);

  return {
    nome,
    email: email || emailInternoTemporario(nome, keyword),
    cargo: cargoFinal,
    location: local,
    habilidades: habilidades.length > 0 ? habilidades : [keyword.slice(0, 80)],
    experiencia: JSON.stringify([{ nome: empresa, cargo: cargoFinal }]),
  };
}

async function importarPorCargo(
  keyword: string,
  location: string,
): Promise<
  | { ok: false; error: string; status: number }
  | {
      ok: true;
      salvos: Array<{ nome: string; email: string; profileId: string; userId: string }>;
    }
> {
  const search = await searchDatagmaPeople({ keyword, location });
  if (!search.ok) {
    return { ok: false, error: search.error, status: search.status === 400 ? 400 : 502 };
  }

  const salvos: Array<{ nome: string; email: string; profileId: string; userId: string }> = [];
  for (const person of extractSearchPeople(search.data).slice(0, MAX_PERFIS)) {
    const email = readDatagmaPersonEmail(person);
    const input = toInput(person, email, keyword, location);
    if (!input) continue;

    const saved = await insertDatagmaProfile(input);
    if (!saved.ok) {
      console.error("Perfil não gravado", input.nome, saved.error);
      continue;
    }

    salvos.push({
      nome: input.nome,
      email: input.email,
      profileId: saved.profileId,
      userId: saved.userId,
    });
  }

  return { ok: true, salvos };
}

export async function POST(request: NextRequest) {
  if (!validateDatamagnetIngestKey(readIngestKey(request))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const raw =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  const keyword =
    typeof raw?.keyword === "string"
      ? raw.keyword.trim()
      : typeof raw?.keywords === "string"
        ? raw.keywords.trim()
        : "";

  const location = typeof raw?.location === "string" && raw.location.trim() ? raw.location.trim() : "Brazil";

  if (keyword.length < 2) {
    return NextResponse.json({ error: "Informe uma palavra-chave" }, { status: 400 });
  }

  let resultado: Awaited<ReturnType<typeof importarPorCargo>>;
  try {
    resultado = await importarPorCargo(keyword, location);
  } catch (error) {
    console.error("Falha ao importar por cargo", error);
    return NextResponse.json({ error: "Falha ao importar por cargo" }, { status: 500 });
  }

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  }

  if (resultado.salvos.length === 0) {
    return NextResponse.json(
      { error: "A busca não devolveu perfis para gravar" },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      keyword,
      location,
      imported: resultado.salvos.length,
      results: resultado.salvos,
    },
    { status: 201 },
  );
}
