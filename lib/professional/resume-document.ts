import { parseCursosDetalhados } from "@/lib/professional/professional-form-config";
import {
  parseJsonSafe,
  type EmpresaExperiencia,
} from "@/lib/professional/professional-profile-map";

const PLACEHOLDER = /^(não preenchido|não informado|profissional|usuário|—|-)$/i;

export type ResumeSource = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  location?: string | null;
  desiredRole?: string | null;
  title?: string | null;
  presentation?: string | null;
  bio?: string | null;
  fullDescription?: string | null;
  experiencesJson?: string | null;
  education?: string | null;
  coursesJson?: string | null;
  skillsJson?: string | null;
  shift?: string | null;
  availability?: string | null;
  area?: string | null;
  experienceTime?: string | null;
  /** Campos proibidos no PDF. O gerador ignora todos eles. */
  cpf?: string | null;
  religion?: string | null;
  sexualOrientation?: string | null;
  address?: string | null;
  backgroundCheck?: string | null;
};

export type ResumeSection = {
  heading: string;
  paragraphs: string[];
};

export type ResumeDocument = {
  name: string | null;
  contacts: string[];
  sections: ResumeSection[];
  missing: string[];
};

function clean(value: string | null | undefined, max = 2500): string | null {
  if (!value) return null;
  const text = value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!text || PLACEHOLDER.test(text)) return null;
  return text.slice(0, max);
}

function formatDate(value: string | null | undefined): string | null {
  const text = clean(value, 40);
  if (!text) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return text;
}

function joinParts(parts: Array<string | null>, separator: string): string | null {
  const filled = parts.filter((part): part is string => Boolean(part));
  return filled.length ? filled.join(separator) : null;
}

function locationOf(source: ResumeSource): string | null {
  const city = clean(source.city, 80);
  const state = clean(source.state, 40);
  if (city && state) return `${city}, ${state}`;
  return city || state || clean(source.location, 120);
}

function roleOf(source: ResumeSource): string | null {
  return clean(source.desiredRole, 160) || clean(source.title, 160);
}

function presentationOf(source: ResumeSource): string | null {
  return clean(source.presentation, 4000) || clean(source.bio, 4000) || clean(source.fullDescription, 4000);
}

function experiencesOf(source: ResumeSource): string[] {
  const rows = parseJsonSafe<unknown>(source.experiencesJson, []);
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Partial<EmpresaExperiencia>;
    const company = clean(item.nome, 160);
    const role = clean(item.cargo, 160);
    const segment = clean(item.segmento, 120);
    const start = formatDate(item.dataInicio);
    const end = formatDate(item.dataFim);
    const description = clean(item.descricao, 4000);
    const heading = joinParts([role, company], " — ");
    const period = joinParts([start, end], " — ");
    const lines = [heading, segment, period, description].filter((line): line is string => Boolean(line));
    return lines.length ? [lines.join("\n")] : [];
  });
}

function coursesOf(source: ResumeSource): string[] {
  return parseCursosDetalhados(source.coursesJson).flatMap((course) => {
    const name = clean(course.nome, 200);
    if (!name) return [];
    const detail = joinParts(
      [
        clean(course.instituicao, 160),
        clean(course.cargaHoraria, 40),
        formatDate(course.dataConclusao),
      ],
      " · ",
    );
    return [detail ? `${name}\n${detail}` : name];
  });
}

function skillsOf(source: ResumeSource): string | null {
  const parsed = parseJsonSafe<unknown>(source.skillsJson, null);
  const values = Array.isArray(parsed)
    ? parsed
    : typeof source.skillsJson === "string" && !source.skillsJson.trim().startsWith("[")
      ? source.skillsJson.split(",")
      : [];
  const skills = values
    .filter((item): item is string => typeof item === "string")
    .map((item) => clean(item, 80))
    .filter((item): item is string => Boolean(item));
  const unique = [...new Set(skills)];
  return unique.length ? unique.join(" · ") : null;
}

function availabilityOf(source: ResumeSource): string | null {
  const shift = clean(source.shift, 80);
  const start = clean(source.availability, 80);
  const parts: string[] = [];
  if (shift) parts.push(`Turno: ${shift}`);
  if (start) parts.push(`Disponibilidade para início: ${start}`);
  return parts.length ? parts.join("\n") : null;
}

export function buildResumeDocument(source: ResumeSource): ResumeDocument {
  const name = clean(source.name, 120);
  const email = clean(source.email, 160);
  const phone = clean(source.phone, 40);
  const place = locationOf(source);
  const contacts = [phone, email, place].filter((item): item is string => Boolean(item));

  const sections: ResumeSection[] = [];
  const role = roleOf(source);
  const area = clean(source.area, 120);
  const experienceTime = clean(source.experienceTime, 80);
  const objective = [role, area, experienceTime ? `Experiência: ${experienceTime}` : null]
    .filter((item): item is string => Boolean(item));
  if (objective.length) sections.push({ heading: "Objetivo", paragraphs: objective });

  const presentation = presentationOf(source);
  if (presentation) sections.push({ heading: "Apresentação", paragraphs: [presentation] });

  const experiences = experiencesOf(source);
  if (experiences.length) sections.push({ heading: "Experiência profissional", paragraphs: experiences });

  const education = clean(source.education, 200);
  if (education) sections.push({ heading: "Formação", paragraphs: [education] });

  const courses = coursesOf(source);
  if (courses.length) sections.push({ heading: "Cursos", paragraphs: courses });

  const skills = skillsOf(source);
  if (skills) sections.push({ heading: "Habilidades", paragraphs: [skills] });

  const availability = availabilityOf(source);
  if (availability) sections.push({ heading: "Disponibilidade", paragraphs: [availability] });

  const missing = [
    name ? null : "Nome profissional",
    place ? null : "Cidade e estado",
    phone ? null : "Telefone",
    email ? null : "E-mail",
    role ? null : "Cargo desejado",
    presentation ? null : "Apresentação profissional",
    experiences.length ? null : "Experiências profissionais",
    education ? null : "Escolaridade",
    courses.length ? null : "Cursos",
    skills ? null : "Habilidades",
    availability ? null : "Turno ou disponibilidade",
  ].filter((item): item is string => Boolean(item));

  return { name, contacts, sections, missing };
}

export function resumePlainText(document: ResumeDocument): string {
  const blocks = [
    document.name,
    document.contacts.join("\n"),
    ...document.sections.flatMap((section) => [section.heading, ...section.paragraphs]),
  ];
  return blocks.filter((item): item is string => Boolean(item)).join("\n");
}
