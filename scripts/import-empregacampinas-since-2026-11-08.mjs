/**
 * Varre empregacampinas.com.br (WP API) desde 08/11/2026 e publica
 * vagas industriais com e-mail no Production (IDs cmimport20261126ec*).
 *
 * Filtros: título industrial (solda, usinagem, produção, manutenção…);
 * prazo ainda aberto (ou sem prazo); e-mail de candidatura; dedupe.
 *
 * Uso: node scripts/import-empregacampinas-since-2026-11-08.mjs
 * Dry-run: DRY_RUN=1 node scripts/import-empregacampinas-since-2026-11-08.mjs
 */
import { PrismaClient } from "@prisma/client";

const AFTER = "2026-11-08T00:00:00";
const TODAY = new Date("2026-11-26T00:00:00");
const BATCH = "import-empregacampinas-2026-11-26";
const DRY_RUN = process.env.DRY_RUN === "1";

const TITLE_INCLUDE = [
  /\bsoldador\b/i,
  /\bsolda\b/i,
  /\bcaldeireiro\b/i,
  /\bcaldeiraria\b/i,
  /\btorneiro\b/i,
  /\bfresador\b/i,
  /\businagem\b/i,
  /\bcnc\b/i,
  /\bferramenteiro\b/i,
  /\bajustador\b/i,
  /\bserralheiro\b/i,
  /\bmontador\b/i,
  /\beletricista\b/i,
  /\bencanador\b/i,
  /\bmec[aâ]nico\b/i,
  /\bmanuten[cç][aã]o\b/i,
  /\boperador de m[aá]quina/i,
  /\boperador cnc\b/i,
  /\boperador de produ/i,
  /\bauxiliar de produ/i,
  /\babastecedor de linha/i,
  /\binjetora\b/i,
  /\bprensa\b/i,
  /\bfunileiro\b/i,
  /\bchapista\b/i,
  /\bpintor industrial\b/i,
  /\blaminador\b/i,
  /\btubista\b/i,
  /\bjato abrasivo\b/i,
  /\bgranalha\b/i,
  /\boperador de caldeira\b/i,
  /\bt[eé]cnico de seguran/i,
  /\bt[eé]cnico em eletro/i,
  /\bt[eé]cnico em mec[aâ]/i,
  /\bt[eé]cnico de manuten/i,
  /\binstrumentista\b/i,
  /\bcalibrador\b/i,
  /\bprogramador de rob/i,
];

const TITLE_EXCLUDE = [
  /farmac/i,
  /atendente/i,
  /cozin/i,
  /chapeiro/i,
  /gar[cç]/i,
  /padeiro/i,
  /vendedor/i,
  /consultor/i,
  /lavador/i,
  /recepcion/i,
  /cuidador/i,
  /bab[aá]/i,
  /enfermeir/i,
  /motorista/i,
  /entregador/i,
  /professor/i,
  /pedag/i,
  /caixa\b/i,
  /financeiro/i,
  /administrativ/i,
  /\brh\b/i,
  /recursos humanos/i,
  /marketing/i,
  /conte[uú]do/i,
  /estoquista/i,
  /estoque\b/i,
  /auxiliar de limpeza/i,
  /faxineir/i,
  /porteiro/i,
  /vigilante/i,
  /analista/i,
  /coordenador/i,
  /gerente/i,
  /telemarketing/i,
  /call center/i,
  /balconista/i,
  /promotor/i,
];

const DROP_TITLE = [
  /salgado/i,
  /aliment/i,
  /ve[ií]culos/i,
  /autom[oó]vel/i,
  /caminh[oõ]es/i,
  /empilhadeira/i,
  /linha leve/i,
  /\bautos\b/i,
  /predial/i,
  /ajudante eletricista/i,
  /ajud\.?\s*eletricista/i,
];

const DROP_COMPANY = [/salgado/i, /padaria/i, /restaurante/i, /aliment/i, /transporte e turismo/i, /loca[cç][aã]o/i];

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "–")
    .replace(/&#038;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmails(text) {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  return [...new Set(m.map((e) => e.toLowerCase()))].filter(
    (e) => !e.includes("empregacampinas") && !e.endsWith(".png") && !e.endsWith(".jpg"),
  );
}

function extractDeadline(text) {
  const m = text.match(/até o dia\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
  return m ? m[1] : null;
}

function parseBRDate(s) {
  if (!s) return null;
  const [d, m, y] = s.split("/").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function extractField(label, text) {
  const re = new RegExp(
    label + "\\s*:\\s*(.+?)(?=\\s*(?:Responsabilidades|Requisitos|Salário|Benefícios|ATENÇÃO|Observações|Os interessados)|$)",
    "i",
  );
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

function isIndustrialTitle(title) {
  if (TITLE_EXCLUDE.some((r) => r.test(title))) return false;
  return TITLE_INCLUDE.some((r) => r.test(title));
}

function cleanTitleKey(t) {
  return t
    .replace(/\s*\/\s*.*/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function roleFromTitle(t) {
  return t.split("/")[0].trim().replace(/\s+/g, " ");
}

function workplaceFromTitle(t) {
  const parts = t.split("/").map((s) => s.trim());
  if (parts.length >= 2) {
    const loc = parts[1].replace(/\d+\s*VAGA.*/i, "").trim();
    return loc || null;
  }
  return null;
}

function parseSalaryCents(salario) {
  if (!salario) return null;
  const m = String(salario).match(/R\$\s*([\d.]+),(\d{2})/);
  if (!m) return null;
  const whole = m[1].replace(/\./g, "");
  const cents = Number(whole) * 100 + Number(m[2]);
  return Number.isFinite(cents) ? cents : null;
}

async function fetchPage(page) {
  const url = `https://empregacampinas.com.br/wp-json/wp/v2/posts?per_page=100&page=${page}&after=${encodeURIComponent(AFTER)}&orderby=date&order=desc&_fields=id,date,link,title,content`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 RecrutaImport/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} page ${page}`);
  return { data: await res.json(), totalPages: Number(res.headers.get("x-wp-totalpages") || "1") };
}

async function scrape() {
  const collected = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 80) {
    const { data, totalPages: tp } = await fetchPage(page);
    totalPages = tp;
    for (const post of data) {
      const title = stripHtml(post.title.rendered);
      if (!isIndustrialTitle(title)) continue;
      const content = stripHtml(post.content.rendered);
      const emails = extractEmails(content);
      if (!emails.length) continue;
      const deadline = extractDeadline(content);
      const deadlineDate = parseBRDate(deadline);
      const open = !deadlineDate || deadlineDate >= TODAY;
      if (!open) continue;
      let company = null;
      const cm = content.match(/^(.+?)\s+está com\s+\d+\s+vaga/i);
      if (cm) company = cm[1].trim().slice(0, 160);
      if (DROP_TITLE.some((r) => r.test(title))) continue;
      if (DROP_COMPANY.some((r) => r.test(company || ""))) continue;
      if (/salgado|alimentício \(salgados\)/i.test(content) && /operador de maquina/i.test(title)) continue;
      collected.push({
        id: post.id,
        date: post.date.slice(0, 10),
        link: post.link,
        title,
        company,
        emails,
        deadline,
        salario: extractField("Salário", content),
        requisitos: extractField("Requisitos", content),
        responsabilidades: extractField("Responsabilidades", content),
        observacoes: extractField("Observações", content),
      });
    }
    process.stderr.write(`page ${page}/${totalPages} openHits=${collected.length}\n`);
    if (!data.length) break;
    page += 1;
  }

  const seen = new Set();
  const deduped = [];
  for (const j of collected) {
    const key = `${j.emails[0]}|${cleanTitleKey(j.title)}|${(j.company || "").slice(0, 40).toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(j);
  }
  return deduped;
}

function buildDescription(j) {
  const role = roleFromTitle(j.title);
  const parts = [`${j.company || "Empresa anunciante"} — vaga de ${role}.`];
  if (j.responsabilidades) parts.push(`Responsabilidades: ${j.responsabilidades}`);
  if (j.requisitos) parts.push(`Requisitos: ${j.requisitos}`);
  if (j.salario) parts.push(`Salário (anúncio): ${j.salario}`);
  if (j.observacoes) parts.push(`Observações: ${j.observacoes}`);
  if (j.deadline) parts.push(`Prazo no anúncio original: até ${j.deadline}.`);
  parts.push(`Anúncio original: ${j.link}`);
  parts.push("Nunca pague para participar de processo seletivo.");
  return parts.join("\n\n").slice(0, 12000);
}

async function main() {
  const jobs = await scrape();
  console.error(`ready_to_import=${jobs.length} dryRun=${DRY_RUN}`);
  if (DRY_RUN) {
    console.log(JSON.stringify({ planned: jobs.length, sample: jobs.slice(0, 20) }, null, 2));
    return;
  }

  const prisma = new PrismaClient();
  const now = new Date();
  let created = 0;
  let updated = 0;
  try {
    for (const j of jobs) {
      const email = j.emails[0].toLowerCase().trim();
      const id = `cmimport20261126ec${j.id}`;
      const salaryCents = parseSalaryCents(j.salario);
      const data = {
        id,
        companyName: (j.company || "Emprega Campinas — anunciante").slice(0, 200),
        confidential: false,
        publicationDate: new Date(`${j.date}T00:00:00.000Z`),
        title: roleFromTitle(j.title).slice(0, 180),
        salaryCents,
        salaryNegotiable: salaryCents == null,
        contractType: "CLT",
        contractTypeOther: null,
        workMode: "PRESENCIAL",
        workplace: (workplaceFromTitle(j.title) || "Campinas e região - SP").slice(0, 180),
        description: buildDescription(j),
        observations: `Fonte: Emprega Campinas (${BATCH}). Link: ${j.link}\nConfira o anúncio original antes de candidatar-se. O Recruta não cobra para se candidatar.`,
        applicationInstructions: `Enviar currículo para ${email}${j.deadline ? ` (prazo no anúncio: ${j.deadline})` : ""}.`,
        applicationMode: "EMAIL",
        externalApplyUrl: j.link.slice(0, 500),
        applicationEmail: email,
        applicationWhatsapp: null,
        manualApplication: false,
        status: "PUBLISHED",
        origin: "ADMIN",
        companyUserId: null,
        createdByUserId: null,
        publishedAt: now,
        closedAt: null,
        countryCode: "BR",
        locale: "pt-BR",
        currency: "BRL",
        timeZone: "America/Sao_Paulo",
      };
      const existing = await prisma.jobPosting.findUnique({ where: { id }, select: { id: true } });
      const { id: _id, publishedAt, ...rest } = data;
      await prisma.jobPosting.upsert({
        where: { id },
        create: data,
        update: { ...rest, ...(existing ? {} : { publishedAt }) },
      });
      if (existing) updated += 1;
      else created += 1;
    }
    const totalPublished = await prisma.jobPosting.count({ where: { status: "PUBLISHED" } });
    const batchCount = await prisma.jobPosting.count({ where: { id: { startsWith: "cmimport20261126ec" } } });
    console.log(JSON.stringify({ batch: BATCH, planned: jobs.length, created, updated, batchCount, totalPublished }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
