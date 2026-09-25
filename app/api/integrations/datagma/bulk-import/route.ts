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

const EMPRESAS_BRASIL = [
  "itau.com.br",
  "ambev.com.br",
  "petrobras.com.br",
  "vale.com",
  "bradesco.com.br",
  "bb.com.br",
  "nubank.com.br",
  "magazineluiza.com.br",
];

const MAX_EMPRESAS = 3;
const MAX_POR_EMPRESA = 2;

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
  domain: string,
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
  const empresa = readText(person.company) || domain;
  const location = readText(person.location) || "Brasil";
  const skills = Array.isArray(person.skills)
    ? person.skills.filter((item): item is string => typeof item === "string")
    : [];
  const habilidades = skills.map((item) => sanitizeInput(item)).filter(Boolean).slice(0, 30);

  return {
    nome,
    email: email || emailInternoTemporario(nome, domain),
    cargo: cargoFinal,
    location,
    habilidades: habilidades.length > 0 ? habilidades : [keyword.slice(0, 80)],
    experiencia: JSON.stringify([{ nome: empresa, cargo: cargoFinal }]),
  };
}

async function importarPorCargo(keyword: string): Promise<
  Array<{ nome: string; email: string; domain: string; profileId: string; userId: string }>
> {
  const salvos: Array<{
    nome: string;
    email: string;
    domain: string;
    profileId: string;
    userId: string;
  }> = [];

  for (const domain of EMPRESAS_BRASIL.slice(0, MAX_EMPRESAS)) {
    const search = await searchDatagmaPeople({
      keyword,
      location: "brazil",
      domain,
    });
    if (!search.ok) {
      console.error("Busca recusada", domain, search.error);
      continue;
    }

    const people = extractSearchPeople(search.data).slice(0, MAX_POR_EMPRESA);
    for (const person of people) {
      const email = readDatagmaPersonEmail(person);
      const input = toInput(person, email, keyword, domain);
      if (!input) continue;

      const saved = await insertDatagmaProfile(input);
      if (!saved.ok) {
        console.error("Perfil não gravado", input.nome, saved.error);
        continue;
      }

      salvos.push({
        nome: input.nome,
        email: input.email,
        domain,
        profileId: saved.profileId,
        userId: saved.userId,
      });
    }
  }

  return salvos;
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

  if (keyword.length < 2) {
    return NextResponse.json({ error: "Informe uma palavra-chave" }, { status: 400 });
  }

  let salvos: Awaited<ReturnType<typeof importarPorCargo>>;
  try {
    salvos = await importarPorCargo(keyword);
  } catch (error) {
    console.error("Falha ao importar por cargo", error);
    return NextResponse.json({ error: "Falha ao importar por cargo" }, { status: 500 });
  }

  if (salvos.length === 0) {
    return NextResponse.json(
      { error: "Nenhum perfil com e-mail real foi gravado" },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      keyword,
      companies: MAX_EMPRESAS,
      imported: salvos.length,
      results: salvos,
    },
    { status: 201 },
  );
}
