import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { isValidEmail, sanitizeInput } from "@/lib/security/security";

const MAX_SKILLS = 30;
const MAX_SKILL_LENGTH = 80;

export type DatamagnetProfileInput = {
  nome: string;
  email: string;
  cargo: string;
  location: string;
  habilidades: string[];
  experiencia?: string;
};

export type DatamagnetProfileError = {
  ok: false;
  status: 400 | 401 | 409 | 500;
  error: string;
};

export type DatamagnetProfileSuccess = {
  ok: true;
  profileId: string;
  userId: string;
};

export function validateDatamagnetIngestKey(
  apiKey: string | null | undefined,
): boolean {
  const expected = process.env.DATAGMA_INGEST_KEY?.trim();
  if (!expected || !apiKey) return false;

  try {
    const a = Buffer.from(apiKey);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
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

function unwrapDatamagnetProfile(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const message = asRecord(body.message);
  if (message) return message;
  const data = asRecord(body.data);
  const nested = data ? asRecord(data.message) : null;
  if (nested) return nested;
  if (
    data &&
    (data.full_name || data.fullName || data.first_name || data.firstName || data.nome)
  ) {
    return data;
  }
  return body;
}

function readNome(raw: Record<string, unknown>): string {
  const direto = readText(
    raw.nome,
    raw.full_name,
    raw.fullName,
    raw.display_name,
    raw.unformatted_full_name,
    raw.name,
  );
  if (direto) return direto;

  const primeiro = readText(raw.first_name, raw.firstName);
  const ultimo = readText(raw.last_name, raw.lastName);
  return [primeiro, ultimo].filter(Boolean).join(" ");
}

export function parseDatamagnetProfile(
  body: unknown,
): { ok: true; data: DatamagnetProfileInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "JSON de perfil inválido" };
  }

  const envelope = body as Record<string, unknown>;
  const data = asRecord(envelope.data);
  const person = asRecord(envelope.person);
  const basic = person ? asRecord(person.basic) ?? person : null;
  const raw = {
    ...unwrapDatamagnetProfile(envelope),
    ...(basic ?? {}),
    ...(data ?? {}),
  };
  const cargoFonte = readText(
    raw.cargo,
    raw.headline,
    raw.profile_headline,
    raw.jobTitle,
    raw.job_title,
    raw.title,
    raw.position,
  );
  const habilidadesFonte = Array.isArray(raw.habilidades)
    ? raw.habilidades
    : Array.isArray(raw.skills)
      ? raw.skills
      : person && Array.isArray(person.skills)
        ? person.skills
        : raw.skills;
  const nome = readNome(raw);
  if (emailInformadoInvalido(data, raw, envelope)) {
    return { ok: false, error: "E-mail inválido" };
  }
  const emailLido = readDatagmaEmail(envelope, data, raw);
  const email = emailLido || emailInternoTemporario(nome);
  const cargo = cargoFonte;
  const location =
    typeof raw.location === "string" && sanitizeInput(raw.location)
      ? sanitizeInput(raw.location)
      : "Não informado";

  if (nome.length < 2) {
    return { ok: false, error: "Nome obrigatório" };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "E-mail inválido" };
  }
  if (cargo.length < 2) {
    return { ok: false, error: "Cargo obrigatório" };
  }
  if (!Array.isArray(habilidadesFonte)) {
    return { ok: false, error: "Habilidades devem ser uma lista" };
  }
  if (habilidadesFonte.length > MAX_SKILLS) {
    return { ok: false, error: "Lista de habilidades excede o limite" };
  }

  const habilidades: string[] = [];
  for (const item of habilidadesFonte) {
    if (typeof item !== "string") {
      return { ok: false, error: "Cada habilidade deve ser texto" };
    }
    const skill = sanitizeInput(item).slice(0, MAX_SKILL_LENGTH);
    if (!skill) continue;
    habilidades.push(skill);
  }

  if (habilidades.length === 0) {
    return { ok: false, error: "Informe ao menos uma habilidade" };
  }

  return {
    ok: true,
    data: { nome, email, cargo, location, habilidades, experiencia: readExperiencia(raw, cargo) },
  };
}

function readExperiencia(raw: Record<string, unknown>, cargo: string): string {
  const lista = Array.isArray(raw.experiences)
    ? raw.experiences
    : Array.isArray(raw.experience)
      ? raw.experience
      : Array.isArray(raw.jobs)
        ? raw.jobs
        : null;
  if (lista) {
    const itens = lista
      .map((item) => {
        const registro = asRecord(item);
        if (!registro) return null;
        const empresa = readText(registro.company, registro.organization, registro.nome, registro.name);
        const funcao = readText(registro.title, registro.jobTitle, registro.cargo) || cargo;
        if (!empresa && !funcao) return null;
        return { nome: empresa || "Indústria", cargo: funcao };
      })
      .filter((item): item is { nome: string; cargo: string } => Boolean(item));
    if (itens.length > 0) return JSON.stringify(itens);
  }

  const empresa = readText(raw.company, raw.currentCompany, raw.organization);
  if (!empresa) return "";
  return JSON.stringify([{ nome: empresa, cargo }]);
}

export function escolherEmailPessoal(
  ...fontes: Array<Record<string, unknown> | null | undefined>
): string {
  const chaves = ["personal_email", "personalEmail", "gmail", "email"] as const;
  const encontrados: string[] = [];
  for (const chave of chaves) {
    for (const fonte of fontes) {
      if (!fonte) continue;
      const email = emailDe(fonte[chave]);
      if (isValidEmail(email)) encontrados.push(email);
    }
  }
  const pessoal = encontrados.find((email) =>
    /@(gmail|hotmail|outlook|live|yahoo)\./i.test(email),
  );
  return pessoal || encontrados[0] || "";
}

export function emailInternoTemporario(nome: string, complemento = ""): string {
  const id = `${nome} ${complemento}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${id || "perfil"}@recrutaindustria.internal`;
}

function emailInformadoInvalido(
  ...fontes: Array<Record<string, unknown> | null | undefined>
): boolean {
  const chaves = ["personal_email", "personalEmail", "email", "gmail"] as const;
  for (const fonte of fontes) {
    if (!fonte) continue;
    for (const chave of chaves) {
      const valor = emailDe(fonte[chave]);
      if (valor && !isValidEmail(valor)) return true;
    }
  }
  return false;
}

function emailDe(value: unknown): string {
  if (typeof value === "string") return value.trim().toLowerCase();
  const registro = asRecord(value);
  if (!registro || typeof registro.email !== "string") return "";
  return registro.email.trim().toLowerCase();
}

function readDatagmaEmail(
  envelope: Record<string, unknown>,
  data: Record<string, unknown> | null,
  raw: Record<string, unknown>,
): string {
  const emailV2 = asRecord(envelope.emailV2);
  return escolherEmailPessoal(data, raw, envelope, emailV2);
}

export async function insertDatagmaProfile(
  input: DatamagnetProfileInput,
): Promise<DatamagnetProfileSuccess | DatamagnetProfileError> {
  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, status: 400, error: "E-mail inválido" };
  }
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, profile: { select: { id: true } } },
  });

  if (existing?.profile) {
    return {
      ok: false,
      status: 409,
      error: "Já existe perfil para este e-mail",
    };
  }

  const skills = JSON.stringify(input.habilidades);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: { name: input.nome },
            select: { id: true },
          })
        : await tx.user.create({
            data: {
              email,
              name: input.nome,
              role: "PROFESSIONAL",
            },
            select: { id: true },
          });

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          title: input.cargo,
          cargoDesejado: input.cargo,
          location: input.location,
          email,
          skills,
          experience: input.experiencia || null,
          experienciasJSON: input.experiencia || null,
          isVisible: false,
          status: "ACTIVE",
        },
        select: { id: true, userId: true },
      });

      await tx.professional.upsert({
        where: { userId: user.id },
        update: { title: input.cargo },
        create: { userId: user.id, title: input.cargo },
      });

      return profile;
    });

    return { ok: true, profileId: created.id, userId: created.userId };
  } catch (error) {
    console.error("[datamagnet] falha ao inserir perfil:", error);
    return { ok: false, status: 500, error: "Erro ao inserir perfil" };
  }
}

export const insertDatamagnetProfile = insertDatagmaProfile;
