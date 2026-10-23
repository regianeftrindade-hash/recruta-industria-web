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
    nome: clip(raw.nome, 120),
    cidade: clip(raw.cidade, 80),
    estado: clip(raw.estado, 40),
    telefone: clip(raw.telefone, 40),
    email: validEmail(clip(raw.email, 120)),
    objetivo: clip(raw.objetivo, 160),
    resumo: clip(raw.resumo, 1200),
    escolaridade: clip(raw.escolaridade, 80),
    curso: clip(raw.curso, 160),
    instituicao: clip(raw.instituicao, 160),
    ano: clip(raw.ano, 12),
    experiencias: experiences.slice(0, 12).flatMap((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const empresa = clip(row.empresa, 120);
      const cargo = clip(row.cargo, 120);
      const inicio = clip(row.inicio, 40);
      const fim = clip(row.fim, 40);
      const atividades = clip(row.atividades, 800);
      const segmento = clip(row.segmento, 80);
      if (!empresa && !cargo && !atividades) return [];
      return [{ empresa, cargo, inicio, fim, atividades, segmento }];
    }),
    cursos: clipList(raw.cursos, 20, 160),
    habilidades: clipList(raw.habilidades, 24, 80),
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

  const jobs = data.experiencias.map((job) => {
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

function wrapText(text: string, size: number, maxWidth: number): string[] {
  const maxChars = Math.max(24, Math.floor(maxWidth / (size * 0.52)));
  const paragraphs = text.split("\n");
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > maxChars && current) {
        lines.push(current);
        current = word.length > maxChars ? word.slice(0, maxChars) : word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

type PlacedLine = { page: number; y: number; font: "F1" | "F2"; size: number; text: string };

function layout(draft: ResumeDraft): PlacedLine[] {
  const { heading, blocks } = resumeBlocks(draft);
  const margin = 48;
  const width = 595 - margin * 2;
  const pageHeight = 842;
  const placed: PlacedLine[] = [];
  let page = 0;
  let y = pageHeight - margin;

  const ensure = (step: number) => {
    if (y - step < margin) {
      page += 1;
      y = pageHeight - margin;
    }
  };

  const write = (text: string, font: "F1" | "F2", size: number) => {
    for (const line of wrapText(text, size, width)) {
      const step = Math.round(size * 1.35);
      ensure(step);
      placed.push({ page, y, font, size, text: line });
      y -= step;
    }
  };

  heading.forEach((line, index) => {
    write(line, index === 0 ? "F2" : "F1", index === 0 ? 16 : 11);
  });

  for (const block of blocks) {
    y -= 8;
    ensure(18);
    write(block.title.toLocaleUpperCase("pt-BR"), "F2", 12);
    y -= 2;
    for (const line of block.lines) write(line, "F1", 11);
  }

  return placed;
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

/** PDF de uma coluna, texto selecionável, sem gráfico nem foto. */
export function renderResumePdf(draft: ResumeDraft): Uint8Array {
  const placed = layout(draft);
  const pageCount = placed.reduce((max, line) => Math.max(max, line.page), 0) + 1;
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
    const lines = placed.filter((line) => line.page === index);
    const commands = ["BT"];
    for (const line of lines) {
      commands.push(`/${line.font} ${line.size} Tf`);
      commands.push(`1 0 0 1 48 ${line.y} Tm`);
      commands.push(`(${pdfEscape(line.text)}) Tj`);
    }
    commands.push("ET");
    const stream = latin1(`${commands.join("\n")}\n`);
    push(
      pageObjectId(index),
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentObjectId(index)} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`,
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
