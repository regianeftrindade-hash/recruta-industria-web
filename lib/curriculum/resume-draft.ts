export type ResumeExperience = {
  empresa: string;
  cargo: string;
  inicio: string;
  fim: string;
  atividades: string;
  segmento: string;
};

/** Dados que podem ir para o PDF. Campos sensíveis do cadastro não entram aqui. */
export type ResumeDraft = {
  nome: string;
  cidade: string;
  estado: string;
  telefone: string;
  email: string;
  objetivo: string;
  resumo: string;
  escolaridade: string;
  curso: string;
  instituicao: string;
  ano: string;
  experiencias: ResumeExperience[];
  cursos: string[];
  habilidades: string[];
  idiomas: string[];
  cnh: string;
};

export function emptyResumeDraft(): ResumeDraft {
  return {
    nome: "",
    cidade: "",
    estado: "",
    telefone: "",
    email: "",
    objetivo: "",
    resumo: "",
    escolaridade: "",
    curso: "",
    instituicao: "",
    ano: "",
    experiencias: [],
    cursos: [],
    habilidades: [],
    idiomas: [],
    cnh: "",
  };
}

function clip(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function clipList(value: unknown, maxItems: number, maxLen: number): string[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n+/)
      : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of source) {
    const text = clip(item, maxLen);
    if (!text) continue;
    const key = text.toLocaleLowerCase("pt-BR");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= maxItems) break;
  }
  return out;
}

function validEmail(value: string): string {
  if (!value) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : "";
}

export function sanitizeResumeDraft(input: unknown): ResumeDraft {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const experiences = Array.isArray(raw.experiencias) ? raw.experiencias : [];
  return {
    nome: clip(raw.nome, 180),
    cidade: clip(raw.cidade, 80),
    estado: clip(raw.estado, 40),
    telefone: clip(raw.telefone, 40),
    email: validEmail(clip(raw.email, 120)),
    objetivo: clip(raw.objetivo, 300),
    resumo: clip(raw.resumo, 4000),
    escolaridade: clip(raw.escolaridade, 80),
    curso: clip(raw.curso, 160),
    instituicao: clip(raw.instituicao, 160),
    ano: clip(raw.ano, 12),
    experiencias: experiences.slice(0, 40).flatMap((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const empresa = clip(row.empresa, 200);
      const cargo = clip(row.cargo, 200);
      const inicio = clip(row.inicio, 40);
      const fim = clip(row.fim, 40);
      const atividades = clip(row.atividades, 5000);
      const segmento = clip(row.segmento, 120);
      if (!empresa && !cargo && !atividades) return [];
      return [{ empresa, cargo, inicio, fim, atividades, segmento }];
    }),
    cursos: clipList(raw.cursos, 40, 200),
    habilidades: clipList(raw.habilidades, 40, 120),
    idiomas: clipList(raw.idiomas, 12, 60),
    cnh: clip(raw.cnh, 20),
  };
}

export type ResumeBlock = {
  title: string;
  lines: string[];
};

export function resumeBlocks(draft: ResumeDraft): { heading: string[]; blocks: ResumeBlock[] } {
  const data = sanitizeResumeDraft(draft);
  const heading: string[] = [];
  if (data.nome) heading.push(data.nome);
  const local = [data.cidade, data.estado].filter(Boolean).join(", ");
  const contact = [local, data.telefone, data.email].filter(Boolean).join(" · ");
  if (contact) heading.push(contact);

  const blocks: ResumeBlock[] = [];
  const add = (title: string, lines: string[]) => {
    const filled = lines.map((line) => line.trim()).filter(Boolean);
    if (filled.length) blocks.push({ title, lines: filled });
  };

  add("Objetivo", [data.objetivo]);
  add("Resumo profissional", [data.resumo]);

  const jobs = sortExperiences(data.experiencias).map((job) => {
    const role = [job.cargo, job.empresa].filter(Boolean).join(" — ");
    const period = [job.inicio, job.fim].filter(Boolean).join(" a ");
    const extra = [job.segmento, period].filter(Boolean).join(" · ");
    return [role, extra, job.atividades].filter(Boolean).join("\n");
  });
  add("Experiência profissional", jobs);

  const formacao = [
    data.escolaridade,
    [data.curso, data.instituicao].filter(Boolean).join(" — "),
    data.ano ? `Conclusão: ${data.ano}` : "",
  ];
  add("Formação", formacao);
  add("Cursos e qualificações", data.cursos);
  add("Habilidades", data.habilidades);
  add("Idiomas", data.idiomas);
  if (data.cnh && !/prefiro não informar/i.test(data.cnh)) {
    add("CNH", [`Categoria ${data.cnh.replace(/^categoria\s+/i, "")}`]);
  }

  return { heading, blocks };
}

export const RESUME_FOOTER = "Currículo gerado pelo site Recruta Indústria";

export const RESUME_MODELS = [
  {
    id: "classico",
    label: "Profissional clássico",
    hint: "Uma coluna, títulos claros e leitura simples.",
  },
  {
    id: "moderno",
    label: "Moderno discreto",
    hint: "Títulos destacados e divisórias sutis.",
  },
  {
    id: "compacto",
    label: "Compacto",
    hint: "Mais conteúdo por página, com fonte ainda legível.",
  },
] as const;

export type ResumeModelId = (typeof RESUME_MODELS)[number]["id"];

export function normalizeResumeModel(value: unknown): ResumeModelId {
  return value === "moderno" || value === "compacto" ? value : "classico";
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const FOOTER_Y = 28;
const FOOTER_SIZE = 8;
const CONTENT_FLOOR = 54;

type ModelStyle = {
  marginX: number;
  marginTop: number;
  nameSize: number;
  contactSize: number;
  titleSize: number;
  bodySize: number;
  leading: number;
  sectionGap: number;
  nameGray: number;
  bodyGray: number;
  titleGray: number;
  rules: boolean;
};

const MODEL_STYLE: Record<ResumeModelId, ModelStyle> = {
  classico: {
    marginX: 54,
    marginTop: 58,
    nameSize: 18,
    contactSize: 11,
    titleSize: 12,
    bodySize: 11,
    leading: 1.4,
    sectionGap: 16,
    nameGray: 0,
    bodyGray: 0.15,
    titleGray: 0.1,
    rules: false,
  },
  moderno: {
    marginX: 50,
    marginTop: 52,
    nameSize: 17,
    contactSize: 11,
    titleSize: 12,
    bodySize: 11,
    leading: 1.38,
    sectionGap: 14,
    nameGray: 0.08,
    bodyGray: 0.18,
    titleGray: 0.22,
    rules: true,
  },
  compacto: {
    marginX: 42,
    marginTop: 40,
    nameSize: 15,
    contactSize: 10,
    titleSize: 11,
    bodySize: 10.5,
    leading: 1.28,
    sectionGap: 9,
    nameGray: 0,
    bodyGray: 0.15,
    titleGray: 0.1,
    rules: false,
  },
};

function dateRank(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  const iso = text.match(/^(\d{4})[-/.](\d{1,2})/);
  if (iso) return Number(iso[1]) * 100 + Number(iso[2]);
  const br = text.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (br) return Number(br[2]) * 100 + Number(br[1]);
  const year = text.match(/(?:19|20)\d{2}/);
  if (!year) return null;
  return Number(year[0]) * 100 + 1;
}

function experienceRank(job: ResumeExperience): number | null {
  const start = dateRank(job.inicio);
  const end = dateRank(job.fim);
  if (start == null && end == null) return null;
  if (start != null && end == null) return 1_000_000 + start;
  return end ?? start;
}

/** Experiências com data ficam da mais recente para a mais antiga. As sem data permanecem no fim. */
export function sortExperiences(jobs: ResumeExperience[]): ResumeExperience[] {
  const dated = jobs.filter((job) => experienceRank(job) != null);
  const undated = jobs.filter((job) => experienceRank(job) == null);
  dated.sort((a, b) => (experienceRank(b) ?? 0) - (experienceRank(a) ?? 0));
  return [...dated, ...undated];
}

const CHAR_WIDTH: Record<string, number> = {
  " ": 278, ".": 278, ",": 278, ":": 278, ";": 278, "-": 333, "·": 333,
  i: 222, l: 222, j: 222, f: 278, t: 278, r: 333, I: 278,
  a: 556, b: 556, c: 500, d: 556, e: 556, g: 556, h: 556, n: 556, o: 556,
  p: 556, q: 556, s: 500, u: 556, v: 500, x: 500, y: 500, z: 500, k: 500,
  m: 833, w: 722, A: 667, B: 667, C: 722, D: 722, E: 611, G: 778, H: 722,
  M: 833, N: 722, O: 778, P: 611, R: 667, S: 667, T: 611, U: 722, V: 667,
  W: 944, L: 556, F: 611,
};

export function resumeTextWidth(text: string, size: number): number {
  let units = 0;
  for (const ch of text.normalize("NFC")) {
    const plain = ch.normalize("NFD").replace(/\p{M}/gu, "");
    units += CHAR_WIDTH[ch] ?? CHAR_WIDTH[plain] ?? CHAR_WIDTH[plain.toLowerCase()] ?? 540;
  }
  return (units * size) / 1000;
}

function pdfEscape(text: string): string {
  let out = "";
  for (const ch of text.normalize("NFC")) {
    if (ch === "\\") {
      out += "\\\\";
      continue;
    }
    if (ch === "(" || ch === ")") {
      out += `\\${ch}`;
      continue;
    }
    const code = ch.charCodeAt(0);
    if ((code >= 32 && code <= 126) || (code >= 160 && code <= 255)) {
      out += ch;
      continue;
    }
    if (ch === "–" || ch === "—") {
      out += "-";
      continue;
    }
    if (ch === "“" || ch === "”") {
      out += "\"";
      continue;
    }
    if (ch === "‘" || ch === "’") {
      out += "'";
      continue;
    }
    out += " ";
  }
  return out;
}

function piecesThatFit(word: string, size: number, maxWidth: number): string[] {
  if (resumeTextWidth(word, size) <= maxWidth) return [word];
  const parts: string[] = [];
  let current = "";
  for (const ch of word) {
    const next = current + ch;
    if (current && resumeTextWidth(next, size) > maxWidth) {
      parts.push(current);
      current = ch;
    } else {
      current = next;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function wrapText(text: string, size: number, maxWidth: number): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let current = "";
    for (const word of words) {
      for (const piece of piecesThatFit(word, size, maxWidth)) {
        const candidate = current ? `${current} ${piece}` : piece;
        if (current && resumeTextWidth(candidate, size) > maxWidth) {
          lines.push(current);
          current = piece;
        } else {
          current = candidate;
        }
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

type FlowLine = {
  text: string;
  font: "F1" | "F2";
  size: number;
  gray: number;
  role: "name" | "contact" | "title" | "body";
  gapBefore: number;
  rule: boolean;
};

export type ResumeLayoutLine = {
  page: number;
  x: number;
  y: number;
  text: string;
  role: FlowLine["role"] | "footer";
  size: number;
};

type Draw =
  | { kind: "text"; page: number; x: number; y: number; font: "F1" | "F2"; size: number; text: string; gray: number; role: ResumeLayoutLine["role"] }
  | { kind: "rule"; page: number; x1: number; x2: number; y: number; gray: number };

function lineHeight(line: FlowLine, style: ModelStyle): number {
  return Math.max(line.size * style.leading, line.size + 2) + (line.rule ? 5 : 0);
}

function flowLines(draft: ResumeDraft, style: ModelStyle): FlowLine[] {
  const { heading, blocks } = resumeBlocks(draft);
  const width = PAGE_W - style.marginX * 2;
  const lines: FlowLine[] = [];
  heading.forEach((text, index) => {
    const size = index === 0 ? style.nameSize : style.contactSize;
    const wrapped = wrapText(text, size, width);
    wrapped.forEach((line, lineIndex) => {
      lines.push({
        text: line,
        font: index === 0 ? "F2" : "F1",
        size,
        gray: index === 0 ? style.nameGray : style.bodyGray,
        role: index === 0 ? "name" : "contact",
        gapBefore: 0,
        rule: style.rules && index === 0 && lineIndex === wrapped.length - 1,
      });
    });
  });

  for (const block of blocks) {
    const title = block.title.toLocaleUpperCase("pt-BR");
    const titleLines = wrapText(title, style.titleSize, width);
    titleLines.forEach((line, lineIndex) => {
      lines.push({
        text: line,
        font: "F2",
        size: style.titleSize,
        gray: style.titleGray,
        role: "title",
        gapBefore: lineIndex === 0 ? style.sectionGap : 0,
        rule: style.rules && lineIndex === titleLines.length - 1,
      });
    });
    for (const paragraph of block.lines) {
      for (const line of wrapText(paragraph, style.bodySize, width)) {
        lines.push({
          text: line,
          font: "F1",
          size: style.bodySize,
          gray: style.bodyGray,
          role: "body",
          gapBefore: 0,
          rule: false,
        });
      }
    }
  }
  return lines;
}

export function inspectResumeLayout(draft: ResumeDraft, model: ResumeModelId = "classico"): {
  pageCount: number;
  footerY: number;
  contentFloor: number;
  lines: ResumeLayoutLine[];
} {
  const draws = layoutResume(draft, normalizeResumeModel(model));
  const lines = draws.flatMap((draw) => (
    draw.kind === "text"
      ? [{ page: draw.page, x: draw.x, y: draw.y, text: draw.text, role: draw.role, size: draw.size }]
      : []
  ));
  const pageCount = draws.reduce((max, draw) => Math.max(max, draw.page), 0) + 1;
  return { pageCount, footerY: FOOTER_Y, contentFloor: CONTENT_FLOOR, lines };
}

function layoutResume(draft: ResumeDraft, model: ResumeModelId): Draw[] {
  const style = MODEL_STYLE[model];
  const lines = flowLines(draft, style);
  const top = PAGE_H - style.marginTop;
  const draws: Draw[] = [];
  let page = 0;
  let y = top;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const height = lineHeight(line, style);
    let needed = height;
    if (line.role === "title") {
      const next = lines[index + 1];
      if (next) needed += next.gapBefore + lineHeight(next, style);
    }
    const gap = y === top ? 0 : line.gapBefore;
    const room = top - CONTENT_FLOOR;
    const keep = needed > room ? height : needed;
    if (y !== top && y - gap - keep < CONTENT_FLOOR) {
      page += 1;
      y = top;
    } else {
      y -= gap;
    }
    draws.push({
      kind: "text",
      page,
      x: style.marginX,
      y,
      font: line.font,
      size: line.size,
      text: line.text,
      gray: line.gray,
      role: line.role,
    });
    if (line.rule) {
      draws.push({
        kind: "rule",
        page,
        x1: style.marginX,
        x2: PAGE_W - style.marginX,
        y: y - line.size * 0.35,
        gray: 0.72,
      });
    }
    y -= height;
  }

  const lastPage = lines.length ? page : 0;
  const footerWidth = resumeTextWidth(RESUME_FOOTER, FOOTER_SIZE);
  const footerX = (PAGE_W - footerWidth) / 2;
  for (let index = 0; index <= lastPage; index += 1) {
    draws.push({
      kind: "text",
      page: index,
      x: footerX,
      y: FOOTER_Y,
      font: "F1",
      size: FOOTER_SIZE,
      text: RESUME_FOOTER,
      gray: 0.45,
      role: "footer",
    });
  }
  return draws;
}

function latin1(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i) & 0xff;
  return bytes;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function pdfNum(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/** PDF A4 de uma coluna. O modelo muda só a apresentação; o rodapé entra em todas as páginas. */
export function renderResumePdf(draft: ResumeDraft, model?: ResumeModelId): Uint8Array {
  const draws = layoutResume(draft, normalizeResumeModel(model));
  const pageCount = draws.reduce((max, draw) => Math.max(max, draw.page), 0) + 1;
  const objects: Uint8Array[] = [];
  const ids: number[] = [];

  const pageObjectId = (index: number) => 5 + index * 2;
  const contentObjectId = (index: number) => 6 + index * 2;

  const push = (id: number, body: string | Uint8Array) => {
    ids.push(id);
    const payload = typeof body === "string" ? latin1(body) : body;
    objects.push(concat([
      latin1(`${id} 0 obj\n`),
      payload,
      latin1("\nendobj\n"),
    ]));
  };

  const kids = Array.from({ length: pageCount }, (_, index) => `${pageObjectId(index)} 0 R`).join(" ");
  push(1, "<< /Type /Catalog /Pages 2 0 R >>");
  push(2, `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`);
  push(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  push(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  for (let index = 0; index < pageCount; index += 1) {
    const pageDraws = draws.filter((draw) => draw.page === index);
    const commands: string[] = [];
    for (const draw of pageDraws) {
      if (draw.kind === "rule") {
        commands.push(`${pdfNum(draw.gray)} G`);
        commands.push("0.4 w");
        commands.push(`${pdfNum(draw.x1)} ${pdfNum(draw.y)} m ${pdfNum(draw.x2)} ${pdfNum(draw.y)} l`);
        commands.push("S");
        continue;
      }
      commands.push(`${pdfNum(draw.gray)} g`);
      commands.push("BT");
      commands.push(`/${draw.font} ${pdfNum(draw.size)} Tf`);
      commands.push(`1 0 0 1 ${pdfNum(draw.x)} ${pdfNum(draw.y)} Tm`);
      commands.push(`(${pdfEscape(draw.text)}) Tj`);
      commands.push("ET");
    }
    const stream = latin1(`${commands.join("\n")}\n`);
    push(
      pageObjectId(index),
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentObjectId(index)} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`,
    );
    push(contentObjectId(index), concat([
      latin1(`<< /Length ${stream.length} >>\nstream\n`),
      stream,
      latin1("endstream"),
    ]));
  }

  const header = latin1("%PDF-1.4\n");
  let cursor = header.length;
  const offsets: number[] = [0];
  const chunks: Uint8Array[] = [header];
  objects.forEach((object, index) => {
    offsets[ids[index]] = cursor;
    chunks.push(object);
    cursor += object.length;
  });

  const size = Math.max(...ids) + 1;
  let xref = `xref\n0 ${size}\n0000000000 65535 f \n`;
  for (let id = 1; id < size; id += 1) {
    xref += `${String(offsets[id] || 0).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer << /Size ${size} /Root 1 0 R >>\nstartxref\n${cursor}\n%%EOF`;
  chunks.push(latin1(xref));
  return concat(chunks);
}
