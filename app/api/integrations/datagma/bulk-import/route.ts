import { NextRequest, NextResponse } from "next/server";
import {
  emailInternoTemporario,
  insertDatamagnetProfile,
  validateDatamagnetIngestKey,
  type DatamagnetProfileInput,
} from "@/lib/integrations/datamagnet-profile";
import { isValidEmail, sanitizeInput } from "@/lib/security/security";

const CARGO_PADRAO = "Auxiliar de Produção";

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

function digitos(value: string): string {
  return value.replace(/\D/g, "");
}

function celularDe(person: Record<string, unknown>): string {
  const bruto =
    readText(person.mobile_phone) ||
    readText(person.mobilePhone) ||
    readText(person.phone) ||
    readText(person.telefone) ||
    readText(person.whatsapp);
  const numeros = digitos(bruto);
  if (numeros.length < 10) return "";
  if (numeros.startsWith("55") && numeros.length >= 12) return numeros;
  return `55${numeros}`;
}

function linkWhatsapp(celular: string): string {
  return celular ? `https://wa.me/${celular}` : "";
}

function emailDoPerfil(person: Record<string, unknown>, nome: string, cargo: string): string {
  const informado = readText(person.email).toLowerCase();
  if (isValidEmail(informado) && !informado.endsWith("@recrutaindustria.internal")) return informado;
  return emailInternoTemporario(nome, cargo);
}

function toInput(person: Record<string, unknown>, cargoPadrao: string): DatamagnetProfileInput | null {
  const nome =
    readText(person.full_name) ||
    readText(person.name) ||
    [readText(person.first_name), readText(person.firstname), readText(person.last_name), readText(person.lastName)]
      .filter(Boolean)
      .join(" ");
  if (nome.length < 2) return null;

  const cargo = readText(person.title) || readText(person.jobTitle) || readText(person.cargo) || cargoPadrao;
  const cargoFinal = cargo.length >= 2 ? cargo : cargoPadrao;
  const celular = celularDe(person);
  const empresa = readText(person.company) || readText(asRecord(person.organization)?.name) || "Indústria";
  const location = readText(person.location) || "Brasil";

  return {
    nome,
    email: emailDoPerfil(person, nome, cargoFinal),
    cargo: cargoFinal,
    location,
    habilidades: [cargoFinal.slice(0, 80)],
    experiencia: JSON.stringify([{ nome: empresa, cargo: cargoFinal }]),
    telefone: celular,
    whatsapp: linkWhatsapp(celular),
  };
}

function listaDePerfis(raw: Record<string, unknown> | null): Record<string, unknown>[] {
  const lista = raw?.people ?? raw?.profiles ?? raw?.perfis;
  if (!Array.isArray(lista)) return [];
  return lista.filter((item) => asRecord(item)) as Record<string, unknown>[];
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
  const cargo =
    typeof raw?.keyword === "string" && raw.keyword.trim().length >= 2
      ? raw.keyword.trim()
      : CARGO_PADRAO;

  const perfis = listaDePerfis(raw);
  if (perfis.length === 0) {
    return NextResponse.json(
      { error: "Nenhum perfil industrial com telefone foi enviado" },
      { status: 400 },
    );
  }

  const salvos: Array<{ nome: string; whatsapp: string; profileId: string; userId: string }> = [];
  for (const person of perfis) {
    const input = toInput(person, cargo);
    if (!input?.whatsapp) continue;

    const saved = await insertDatamagnetProfile(input);
    if (!saved.ok) {
      console.error("Perfil não gravado", input.nome, saved.error);
      continue;
    }

    salvos.push({
      nome: input.nome,
      whatsapp: input.whatsapp,
      profileId: saved.profileId,
      userId: saved.userId,
    });
  }

  if (salvos.length === 0) {
    return NextResponse.json(
      { error: "Nenhum celular foi encontrado para gravar o WhatsApp" },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { success: true, keyword: cargo, imported: salvos.length, results: salvos },
    { status: 201 },
  );
}
