import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ResumeDocument } from "@/lib/professional/resume-document";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const FOOTER = 36;
const GOLD = rgb(141 / 255, 107 / 255, 31 / 255);
const INK = rgb(0.1, 0.1, 0.1);
const MUTED = rgb(0.28, 0.28, 0.28);

function toWinAnsi(value: string): string {
  return value
    .replace(/\u2014|\u2013/g, "-")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\u2026/g, "...")
    .replace(/[^\n\u0020-\u007E\u00A0-\u00FF]/g, "");
}

function wrapLine(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const clean = toWinAnsi(text).replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";

  const pushLong = (token: string) => {
    let rest = token;
    while (rest) {
      let take = rest.length;
      while (take > 1 && font.widthOfTextAtSize(rest.slice(0, take), size) > maxWidth) take -= 1;
      lines.push(rest.slice(0, take));
      rest = rest.slice(take);
    }
  };

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    if (font.widthOfTextAtSize(word, size) <= maxWidth) current = word;
    else {
      current = "";
      pushLong(word);
    }
  }
  if (current) lines.push(current);
  return lines;
}

function wrapParagraph(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  return toWinAnsi(text)
    .split("\n")
    .flatMap((line) => {
      const wrapped = wrapLine(line, font, size, maxWidth);
      return wrapped.length ? wrapped : [""];
    });
}

type Cursor = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
};

function paintFooter(page: PDFPage, font: PDFFont) {
  page.drawText("Recruta Indústria", {
    x: MARGIN,
    y: 22,
    size: 9,
    font,
    color: GOLD,
  });
}

function addPage(cursor: Cursor) {
  cursor.page = cursor.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  cursor.y = PAGE_HEIGHT - MARGIN;
  paintFooter(cursor.page, cursor.regular);
}

function ensure(cursor: Cursor, height: number) {
  if (cursor.y - height >= FOOTER + 8) return;
  addPage(cursor);
}

function drawLines(
  cursor: Cursor,
  lines: string[],
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  const leading = size + 4;
  for (const line of lines) {
    ensure(cursor, leading);
    if (line) {
      cursor.page.drawText(line, {
        x: MARGIN,
        y: cursor.y - size,
        size,
        font,
        color,
      });
    }
    cursor.y -= leading;
  }
}

export async function renderResumePdf(document: ResumeDocument): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(document.name ? `Currículo - ${toWinAnsi(document.name)}` : "Currículo");
  doc.setCreator("Recruta Indústria");
  if (document.name) doc.setAuthor(toWinAnsi(document.name));

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const cursor: Cursor = {
    doc,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - MARGIN,
    regular,
    bold,
  };
  paintFooter(cursor.page, regular);
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  const name = document.name ? wrapParagraph(document.name, bold, 22, maxWidth) : ["Currículo"];
  drawLines(cursor, name, bold, 22, INK);
  cursor.y -= 4;
  ensure(cursor, 8);
  cursor.page.drawLine({
    start: { x: MARGIN, y: cursor.y },
    end: { x: PAGE_WIDTH - MARGIN, y: cursor.y },
    thickness: 1.5,
    color: GOLD,
  });
  cursor.y -= 16;

  if (document.contacts.length) {
    drawLines(
      cursor,
      wrapParagraph(document.contacts.join("  ·  "), regular, 11, maxWidth),
      regular,
      11,
      MUTED,
    );
    cursor.y -= 8;
  }

  if (!document.sections.length) {
    drawLines(
      cursor,
      wrapParagraph("Os campos profissionais ainda não foram salvos neste perfil.", regular, 11, maxWidth),
      regular,
      11,
      MUTED,
    );
  }

  for (const section of document.sections) {
    cursor.y -= 8;
    drawLines(cursor, [toWinAnsi(section.heading).toUpperCase()], bold, 12, GOLD);
    ensure(cursor, 6);
    cursor.page.drawLine({
      start: { x: MARGIN, y: cursor.y + 2 },
      end: { x: MARGIN + 72, y: cursor.y + 2 },
      thickness: 0.8,
      color: GOLD,
    });
    cursor.y -= 8;
    section.paragraphs.forEach((paragraph, index) => {
      if (index > 0) cursor.y -= 6;
      drawLines(cursor, wrapParagraph(paragraph, regular, 11, maxWidth), regular, 11, INK);
    });
  }

  return doc.save();
}
