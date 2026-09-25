import { after, NextRequest, NextResponse } from "next/server";
import {
  extractSearchPeople,
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
    readText(person.full_name) ||
    readText(person.name) ||
    [readText(person.firstname), readText(person.firstName), readText(person.lastName)]
      .filter(Boolean)
      .join(" ");
  if (nome.length < 2 || email.length < 3) return null;

  const cargo =
    readText(person.jobTitle) ||
    readText(person.title) ||
    readText(person.headline) ||
    keyword;
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

const MAX_PERFIS_POR_LOTE = 3;

export const maxDuration = 60;

function readLimit(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(parsed)) return MAX_PERFIS_POR_LOTE;
  return Math.min(MAX_PERFIS_POR_LOTE, Math.max(1, Math.trunc(parsed)));
}

async function gravarPerfis(
  people: Record<string, unknown>[],
  keyword: string,
  location: string,
): Promise<void> {
  for (const person of people) {
    let email = readDatagmaPersonEmail(person);
    let input = toInput(person, email, keyword, location);

    const linkedInUrl =
      readText(person.linkedInUrl) ||
      readText(person.url) ||
      readText(person.profile_url) ||
      readText(person.navigation_url);
    if ((!input || !email) && linkedInUrl.startsWith("https://")) {
      const remote = await fetchDatamagnetPerson(linkedInUrl);
      if (remote.ok) {
        const parsed = parseDatamagnetProfile(remote.data);
        if (parsed.ok) input = parsed.data;
      }
    }

    if (!input) {
      console.error(
        "Perfil do lote sem e-mail",
        readText(person.full_name) || readText(person.name),
      );
      continue;
    }

    const saved = await insertDatagmaProfile(input);
    if (!saved.ok) {
      console.error("Perfil do lote não gravado", input.nome, saved.error);
    }
  }
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
  const location = typeof raw?.location === "string" ? raw.location.trim() : "";

  if (keyword.length < 2) {
    return NextResponse.json({ error: "Informe uma palavra-chave" }, { status: 400 });
  }

  const search = await searchDatagmaPeople({ keyword, location });
  if (!search.ok) {
    const status =
      search.status === 401 || search.status === 400 || search.status === 409
        ? search.status
        : 500;
    return NextResponse.json({ error: search.error }, { status });
  }

  const found = extractSearchPeople(search.data);
  const people = found.slice(0, readLimit(raw?.limit));

  if (people.length > 0) {
    after(async () => {
      try {
        await gravarPerfis(people, keyword, location);
      } catch (error) {
        console.error("Falha ao gravar o lote do Datagma", error);
      }
    });
  }

  return NextResponse.json(
    {
      success: true,
      found: found.length,
      queued: people.length,
    },
    { status: 201 },
  );
}
