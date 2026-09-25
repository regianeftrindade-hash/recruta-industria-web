import { NextRequest, NextResponse } from "next/server";
import {
  emailInternoTemporario,
  insertDatamagnetProfile,
  validateDatamagnetIngestKey,
  type DatamagnetProfileInput,
} from "@/lib/integrations/datamagnet-profile";
import { sanitizeInput } from "@/lib/security/security";

const APOLLO_SEARCH_URL = "https://api.apollo.io/api/v1/mixed_people/api_search";
const APOLLO_MATCH_URL = "https://api.apollo.io/api/v1/people/match";
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function apolloHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "x-api-key": apiKey,
  };
}

function readEmail(person: Record<string, unknown>): string {
  const direto = readText(person.email).toLowerCase();
  if (direto.includes("@")) return direto;
  const pessoais = Array.isArray(person.personal_emails) ? person.personal_emails : [];
  for (const item of pessoais) {
    const email = readText(item).toLowerCase();
    if (email.includes("@")) return email;
  }
  return "";
}

function toInput(
  person: Record<string, unknown>,
  email: string,
  keyword: string,
  location: string,
): DatamagnetProfileInput | null {
  const nome =
    readText(person.name) ||
    [readText(person.first_name), readText(person.last_name)].filter(Boolean).join(" ");
  if (nome.length < 2) return null;

  const cargo = readText(person.title) || keyword;
  const organizacao = asRecord(person.organization);
  const empresa = readText(organizacao?.name) || readText(person.organization_name) || "Indústria";
  const local =
    [readText(person.city), readText(person.state), readText(person.country)].filter(Boolean).join(", ") ||
    location;

  return {
    nome,
    email: email || emailInternoTemporario(nome, keyword),
    cargo: cargo.length >= 2 ? cargo : keyword,
    location: local,
    habilidades: [keyword.slice(0, 80)],
    experiencia: JSON.stringify([{ nome: empresa, cargo: cargo.length >= 2 ? cargo : keyword }]),
  };
}

async function buscarPessoas(
  apiKey: string,
  keyword: string,
  location: string,
): Promise<{ ok: true; people: Record<string, unknown>[] } | { ok: false; status: number; error: string }> {
  const url = new URL(APOLLO_SEARCH_URL);
  url.searchParams.append("person_titles[]", keyword);
  url.searchParams.append("person_locations[]", location);
  url.searchParams.set("per_page", String(MAX_PERFIS));
  url.searchParams.set("page", "1");

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: apolloHeaders(apiKey),
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 502, error: "Apollo indisponível" };
  }

  const text = await response.text();
  if (!response.ok) {
    return { ok: false, status: response.status, error: "Apollo recusou a busca" };
  }

  try {
    const data = text ? (JSON.parse(text) as Record<string, unknown>) : null;
    const people = Array.isArray(data?.people) ? data.people : [];
    return {
      ok: true,
      people: people.filter((item) => asRecord(item)) as Record<string, unknown>[],
    };
  } catch {
    return { ok: false, status: 502, error: "Resposta do Apollo não é JSON" };
  }
}

async function enriquecerPessoa(
  apiKey: string,
  person: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const id = readText(person.id);
  if (!id) return person;

  const url = new URL(APOLLO_MATCH_URL);
  url.searchParams.set("id", id);
  url.searchParams.set("reveal_personal_emails", "true");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: apolloHeaders(apiKey),
      cache: "no-store",
    });
    if (!response.ok) return person;
    const data = asRecord(await response.json());
    const enriched = asRecord(data?.person);
    return enriched ? { ...person, ...enriched } : person;
  } catch {
    return person;
  }
}

export async function POST(request: NextRequest) {
  if (!validateDatamagnetIngestKey(readIngestKey(request))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const apiKey = process.env.APOLLO_API_KEY?.trim() ?? "";
  if (!apiKey) {
    return NextResponse.json({ error: "Apollo não configurado" }, { status: 500 });
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
    typeof raw?.keyword === "string" && raw.keyword.trim().length >= 2
      ? raw.keyword.trim()
      : "Auxiliar de Produção";
  const location =
    typeof raw?.location === "string" && raw.location.trim()
      ? raw.location.trim()
      : "Brazil";

  const search = await buscarPessoas(apiKey, keyword, location);
  if (!search.ok) {
    const status = search.status === 400 || search.status === 401 ? search.status : 502;
    return NextResponse.json({ error: search.error }, { status });
  }

  const salvos: Array<{ nome: string; email: string; profileId: string; userId: string }> = [];
  for (const person of search.people.slice(0, MAX_PERFIS)) {
    const completo = await enriquecerPessoa(apiKey, person);
    const input = toInput(completo, readEmail(completo), keyword, location);
    if (!input) continue;

    const saved = await insertDatamagnetProfile(input);
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

  if (salvos.length === 0) {
    return NextResponse.json({ error: "A busca não devolveu perfis para gravar" }, { status: 502 });
  }

  return NextResponse.json(
    {
      success: true,
      keyword,
      location,
      imported: salvos.length,
      results: salvos,
    },
    { status: 201 },
  );
}
