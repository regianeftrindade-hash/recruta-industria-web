import { NextRequest, NextResponse } from "next/server";
import {
  extractSearchPeople,
  searchDatamagnetPeople,
  toProfileInput,
} from "@/lib/integrations/datamagnet-client";
import {
  insertDatamagnetProfile,
  validateDatamagnetIngestKey,
} from "@/lib/integrations/datamagnet-profile";

function readIngestKey(request: NextRequest): string | null {
  const header = request.headers.get("x-api-key")?.trim();
  if (header) return header;

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
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
  const page = typeof raw?.page === "number" ? raw.page : 1;

  if (keyword.length < 2) {
    return NextResponse.json({ error: "Informe uma palavra-chave" }, { status: 400 });
  }

  const search = await searchDatamagnetPeople({ keyword, location, page });
  if (!search.ok) {
    const status =
      search.status === 401 || search.status === 400 || search.status === 409
        ? search.status
        : 500;
    return NextResponse.json({ error: search.error }, { status });
  }

  const people = extractSearchPeople(search.data);
  const results: Array<
    | { nome: string; success: true; profileId: string; userId: string }
    | { nome: string; success: false; error: string }
  > = [];

  for (const person of people) {
    const input = toProfileInput(person, keyword, location);
    if (!input) {
      results.push({ nome: "", success: false, error: "Nome obrigatório" });
      continue;
    }

    const saved = await insertDatamagnetProfile(input);
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
