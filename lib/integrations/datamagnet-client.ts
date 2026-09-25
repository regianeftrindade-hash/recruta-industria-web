import { loadEnvConfig } from "@next/env";
import {
  insertDatamagnetProfile,
  parseDatamagnetProfile,
  type DatamagnetProfileError,
  type DatamagnetProfileInput,
  type DatamagnetProfileSuccess,
} from "@/lib/integrations/datamagnet-profile";
import { sanitizeInput } from "@/lib/security/security";

const DATAGMA_FULL_URL = "https://gateway.datagma.net/api/ingress/v2/full";
const PEOPLE_KEYWORD_SEARCH_URL = "https://gateway.datagma.net/api/ingress/v1/find_people";

function readServerEnv(name: string): string {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", undefined, true);
  return process.env[name]?.trim() ?? "";
}
const PERSON_SEARCH_PATH = "/api/v1/people-search/search";

export function isPublicProfileUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export async function fetchDatamagnetPerson(
  profileUrl: string,
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; error: string }> {
  const apiKey = readServerEnv("DATAGMA_API_KEY");

  if (!apiKey) {
    return { ok: false, status: 500, error: "Datagma não configurado" };
  }
  if (!isPublicProfileUrl(profileUrl)) {
    return { ok: false, status: 400, error: "Informe uma URL https de perfil" };
  }

  const url = new URL(DATAGMA_FULL_URL);
  url.searchParams.set("apiId", apiKey);
  url.searchParams.set("data", profileUrl);

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: "Datagma recusou a consulta",
    };
  }

  try {
    return { ok: true, data: text ? JSON.parse(text) : null };
  } catch {
    return { ok: false, status: 502, error: "Resposta do Datagma não é JSON" };
  }
}

export async function searchDatagmaPeople(input: {
  keyword: string;
  location?: string;
}): Promise<{ ok: true; data: unknown } | { ok: false; status: number; error: string }> {
  const apiKey = readServerEnv("DATAGMA_API_KEY");
  if (!apiKey) {
    return { ok: false, status: 500, error: "Datagma não configurado" };
  }

  const keyword = input.keyword.trim();
  if (keyword.length < 2) {
    return { ok: false, status: 400, error: "Informe uma palavra-chave" };
  }

  const url = new URL(PEOPLE_KEYWORD_SEARCH_URL);
  url.searchParams.set("apiId", apiKey);
  url.searchParams.set("currentJobTitle", keyword);
  const location = input.location?.trim().toLowerCase();
  if (location) url.searchParams.set("countries", location);

  let response: Response;
  try {
    response = await fetch(url, { method: "GET", cache: "no-store" });
  } catch {
    return { ok: false, status: 502, error: "Datagma indisponível" };
  }
  const text = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: "Datagma recusou a busca",
    };
  }

  try {
    return { ok: true, data: text ? JSON.parse(text) : null };
  } catch {
    return { ok: false, status: 502, error: "Resposta da busca não é JSON" };
  }
}

export function extractDatagmaEmployees(payload: unknown): Record<string, unknown>[] {
  const root = asRecord(payload);
  if (!root || !Array.isArray(root.employees)) return [];
  return root.employees.filter((item) => asRecord(item)) as Record<string, unknown>[];
}

export function readDatagmaPersonEmail(person: Record<string, unknown>): string {
  const emailObj = asRecord(person.email);
  const data = asRecord(person.data);
  const dataEmail = asRecord(data?.email);
  const candidatos = [
    data?.email,
    dataEmail?.email,
    typeof person.email === "string" ? person.email : emailObj?.email,
  ];
  for (const value of candidatos) {
    if (typeof value !== "string") continue;
    const email = value.trim().toLowerCase();
    if (email) return email;
  }
  return "";
}

export async function searchDatamagnetPeople(input: {
  keyword: string;
  location?: string;
  page?: number;
}): Promise<{ ok: true; data: unknown } | { ok: false; status: number; error: string }> {
  const apiKey = process.env.DATAMAGNET_API_KEY?.trim();
  const apiUrl = (process.env.DATAMAGNET_API_URL || "").trim().replace(/\/+$/, "");

  if (!apiKey || !apiUrl) {
    return { ok: false, status: 500, error: "Datamagnet não configurado" };
  }

  const keyword = input.keyword.trim();
  if (keyword.length < 2) {
    return { ok: false, status: 400, error: "Informe uma palavra-chave" };
  }

  const body: Record<string, unknown> = {
    keywords: keyword,
    page: input.page && input.page > 0 ? input.page : 1,
  };
  const location = input.location?.trim();
  if (location) body.location = location;

  const response = await fetch(`${apiUrl}${PERSON_SEARCH_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: "Datamagnet recusou a busca",
    };
  }

  try {
    return { ok: true, data: text ? JSON.parse(text) : null };
  } catch {
    return { ok: false, status: 502, error: "Resposta do Datamagnet não é JSON" };
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const clean = sanitizeInput(value);
    if (clean) return clean;
  }
  return "";
}

export function extractSearchPeople(payload: unknown): Record<string, unknown>[] {
  const root = asRecord(payload);
  if (!root) return [];

  if (Array.isArray(root.employees)) {
    return root.employees.filter((item) => asRecord(item)) as Record<string, unknown>[];
  }

  if (Array.isArray(root.results)) {
    return root.results.filter((item) => asRecord(item)) as Record<string, unknown>[];
  }

  const data = asRecord(root.data);
  if (data && Array.isArray(data.people)) {
    return data.people.filter((item) => asRecord(item)) as Record<string, unknown>[];
  }
  if (Array.isArray(root.data)) {
    return root.data.filter((item) => asRecord(item)) as Record<string, unknown>[];
  }

  return [];
}

export function toProfileInput(
  raw: Record<string, unknown>,
  keyword: string,
  locationFallback: string,
): DatamagnetProfileInput | null {
  const nomeDireto = readText(
    raw.full_name,
    raw.fullName,
    raw.nome,
    raw.display_name,
    raw.name,
  );
  const nome =
    nomeDireto ||
    [readText(raw.first_name, raw.firstName), readText(raw.last_name, raw.lastName)]
      .filter(Boolean)
      .join(" ");
  if (nome.length < 2) return null;

  const cargo =
    readText(
      raw.cargo,
      raw.title,
      raw.headline,
      raw.profile_headline,
      raw.job_title,
      raw.primary_subtitle,
    ) || keyword;
  const location =
    readText(raw.location, raw.secondary_subtitle) || locationFallback || "Não informado";

  const fonte = Array.isArray(raw.skills)
    ? raw.skills
    : Array.isArray(raw.habilidades)
      ? raw.habilidades
      : [];
  const habilidades = fonte
    .filter((item): item is string => typeof item === "string")
    .map((item) => sanitizeInput(item))
    .filter(Boolean)
    .slice(0, 30);

  return {
    nome,
    email: readText(raw.email),
    cargo: cargo.length >= 2 ? cargo : keyword,
    location,
    habilidades: habilidades.length > 0 ? habilidades : [keyword.slice(0, 80)],
  };
}

export async function importDatamagnetProfileFromUrl(
  profileUrl: string,
): Promise<DatamagnetProfileSuccess | DatamagnetProfileError> {
  const remote = await fetchDatamagnetPerson(profileUrl);
  if (!remote.ok) {
    const status =
      remote.status === 401 || remote.status === 400 || remote.status === 409
        ? remote.status
        : 500;
    return { ok: false, status, error: remote.error };
  }

  const parsed = parseDatamagnetProfile(remote.data);
  if (!parsed.ok) {
    return { ok: false, status: 400, error: parsed.error };
  }

  return insertDatamagnetProfile(parsed.data);
}
