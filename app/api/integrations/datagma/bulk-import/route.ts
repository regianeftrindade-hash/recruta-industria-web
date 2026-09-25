import { NextRequest, NextResponse } from "next/server";
import {
  extractDatagmaEmployees,
  fetchDatamagnetPerson,
  readDatagmaPersonEmail,
  searchDatagmaPeople,
} from "@/lib/integrations/datamagnet-client";
import {
  insertDatagmaProfile,
  parseDatamagnetProfile,
  validateDatamagnetIngestKey,
  type DatamagnetProfileInput,
} from "@/lib/integrations/datamagnet-profile";
import { sanitizeInput } from "@/lib/security/security";

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
  locationFallback: string,
): DatamagnetProfileInput | null {
  const nome =
    readText(person.name) ||
    [readText(person.firstname), readText(person.firstName), readText(person.lastName)]
      .filter(Boolean)
      .join(" ");
  if (nome.length < 2 || email.length < 3) return null;

  const cargo = readText(person.jobTitle) || readText(person.title) || keyword;
  const location = readText(person.location) || locationFallback || "Não informado";
  const skills = Array.isArray(person.skills)
    ? person.skills.filter((item): item is string => typeof item === "string")
    : [];
  const habilidades = skills.map((item) => sanitizeInput(item)).filter(Boolean).slice(0, 30);

  return {
    nome,
    email,
    cargo: cargo.length >= 2 ? cargo : keyword,
    location,
    habilidades: habilidades.length > 0 ? habilidades : [keyword.slice(0, 80)],
  };
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
  const keyword = typeof raw?.keyword === "string" ? raw.keyword.trim() : "";
  const location = typeof raw?.location === "string" ? raw.location.trim() : "";
  const company = typeof raw?.company === "string" ? raw.company.trim() : "";

  if (keyword.length < 2) {
    return NextResponse.json({ error: "Informe uma palavra-chave" }, { status: 400 });
  }

  const search = await searchDatagmaPeople({ keyword, location, company });
  if (!search.ok) {
    const status =
      search.status === 401 || search.status === 400 || search.status === 409
        ? search.status
        : 500;
    return NextResponse.json({ error: search.error }, { status });
  }

  const people = extractDatagmaEmployees(search.data);
  const results: Array<
    | { nome: string; success: true; profileId: string; userId: string }
    | { nome: string; success: false; error: string }
  > = [];

  for (const person of people) {
    let email = readDatagmaPersonEmail(person);
    let input = toInput(person, email, keyword, location);

    const linkedInUrl = readText(person.linkedInUrl);
    if ((!input || !email) && linkedInUrl.startsWith("https://")) {
      const remote = await fetchDatamagnetPerson(linkedInUrl);
      if (remote.ok) {
        const parsed = parseDatamagnetProfile(remote.data);
        if (parsed.ok) input = parsed.data;
      }
    }

    if (!input) {
      results.push({
        nome: readText(person.name),
        success: false,
        error: "E-mail inválido",
      });
      continue;
    }

    const saved = await insertDatagmaProfile(input);
    if (!saved.ok) {
      results.push({ nome: input.nome, success: false, error: saved.error });
      continue;
    }

    results.push({
      nome: input.nome,
      success: true,
      profileId: saved.profileId,
      userId: saved.userId,
    });
  }

  const imported = results.filter((item) => item.success).length;
  return NextResponse.json(
    {
      success: true,
      found: people.length,
      imported,
      failed: results.length - imported,
      results,
    },
    { status: 201 },
  );
}
