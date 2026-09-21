/**
 * Extrai campos do currículo por padrões/heurísticas (sem IA).
 */

import {
  CNH_CATEGORIAS,
  CURSOS_INDUSTRIAIS_SUGERIDOS,
  ESCOLARIDADES_OPCOES,
  INFORMATICA_OPCOES,
  MAQUINAS_EQUIPAMENTOS,
  QUALIDADE_PROCESSOS,
} from '@/lib/professional-form-config';
import type { ResumeStructuredFields } from '@/lib/curriculum/types';

const UF_SET = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]);

const UF_NOME_PARA_SIGLA: Record<string, string> = {
  acre: 'AC',
  alagoas: 'AL',
  amapa: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceara: 'CE',
  'distrito federal': 'DF',
  'espirito santo': 'ES',
  goias: 'GO',
  maranhao: 'MA',
  'mato grosso': 'MT',
  'mato grosso do sul': 'MS',
  'minas gerais': 'MG',
  para: 'PA',
  paraiba: 'PB',
  parana: 'PR',
  pernambuco: 'PE',
  piaui: 'PI',
  'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN',
  'rio grande do sul': 'RS',
  rondonia: 'RO',
  roraima: 'RR',
  'santa catarina': 'SC',
  'sao paulo': 'SP',
  sergipe: 'SE',
  tocantins: 'TO',
};

/** Cidades frequentes em currículos → UF (ajuda quando não vem a sigla). */
const CIDADE_UF_COMUM: Record<string, string> = {
  cascavel: 'PR',
  'foz do iguacu': 'PR',
  'ponta grossa': 'PR',
  guarapuava: 'PR',
  colombo: 'PR',
  araucaria: 'PR',
  toledo: 'PR',
  'francisco beltrao': 'PR',
  'pato branco': 'PR',
  curitiba: 'PR',
  'sao jose dos pinhais': 'PR',
  londrina: 'PR',
  maringa: 'PR',
  'sao paulo': 'SP',
  campinas: 'SP',
  santos: 'SP',
  guarulhos: 'SP',
  sorocaba: 'SP',
  'ribeirao preto': 'SP',
  'sao bernardo do campo': 'SP',
  osasco: 'SP',
  'rio de janeiro': 'RJ',
  niteroi: 'RJ',
  'belo horizonte': 'MG',
  uberlandia: 'MG',
  contagem: 'MG',
  'juiz de fora': 'MG',
  brasilia: 'DF',
  salvador: 'BA',
  'feira de santana': 'BA',
  fortaleza: 'CE',
  recife: 'PE',
  'porto alegre': 'RS',
  caxias: 'RS',
  'caxias do sul': 'RS',
  florianopolis: 'SC',
  joinville: 'SC',
  blumenau: 'SC',
  manaus: 'AM',
  belem: 'PA',
  goiania: 'GO',
  cuiaba: 'MT',
  'campo grande': 'MS',
  vitoria: 'ES',
  natal: 'RN',
  'joao pessoa': 'PB',
  maceio: 'AL',
  aracaju: 'SE',
  teresina: 'PI',
  'sao luis': 'MA',
};

const SECTION_HEADERS: Record<string, RegExp> = {
  experiencia: /^(experi[eê]ncia(?:s)?(?:\s+profissional(?:is)?)?|historico\s+profissional|atuacao\s+profissional)\b/i,
  formacao: /^(forma[cç][aã]o(?:\s+acad[eê]mica)?|escolaridade|educa[cç][aã]o)\b/i,
  cursos: /^(cursos(?:\s+e\s+certifica[cç][oõ]es)?|certifica[cç][oõ]es|qualifica[cç][oõ]es|treinamentos?)\b/i,
  competencias: /^(compet[eê]ncias|habilidades|skills|conhecimentos(?:\s+t[eé]cnicos)?)\b/i,
  dados: /^(dados\s+pessoais|contato|informa[cç][oõ]es\s+pessoais|objetivo|endere[cç]o)\b/i,
};

const SKIP_NAME_LINES =
  /^(curr[ií]culo|curriculum|vitae|cv|resumo|objetivo|perfil|dados|contato|telefone|email|e-mail|endere[cç]o|experiencia|forma[cç][aã]o|celular|whatsapp)/i;

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** PDF às vezes cola campos; separa rótulos e e-mail/telefone. */
export function preprocessResumeText(raw: string): string {
  let t = String(raw || '').replace(/\r\n/g, '\n').replace(/\u0000/g, '');

  // Espaço entre minúscula/número e maiúscula (texto colado de PDF)
  t = t.replace(/([a-záàâãéêíóôõúç0-9])([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/g, '$1 $2');

  t = t.replace(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})(?=\(?\d)/gi, '$1\n');
  t = t.replace(/(\d{4,5}[-.\s]?\d{4})(?=[A-Za-zÀ-ÿ])/g, '$1\n');
  t = t.replace(/(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4})(?=[A-Za-zÀ-ÿ])/g, '$1\n');

  t = t.replace(
    /\s+(?=(?:Nome|E-?mail|Telefone|Celular|WhatsApp|Endere[cç]o|Cidade|Munic[ií]pio|Estado|UF|Naturalidade|CNH|Data\s+de\s+nascimento|Nascimento|Idade|Experi[eê]ncia|Forma[cç][aã]o|Escolaridade|Cursos|Compet[eê]ncias|Habilidades|Objetivo|Dados\s+pessoais|Contato|CEP)\b)/gi,
    '\n',
  );

  // Tabela Word cola rótulo+valor: "Cidade:CuritibaEstado:PR"
  t = t.replace(
    /(Cidade|Munic[ií]pio|Estado|UF|Naturalidade|Endere[cç]o|CEP)\s*[:\-–]?\s*/gi,
    '\n$1: ',
  );

  t = t.replace(
    /(?<=[^\n])(?=(?:Experi[eê]ncia(?:s)?(?:\s+Profissional)?|Forma[cç][aã]o(?:\s+Acad[eê]mica)?|Cursos(?:\s+e\s+Certifica[cç][oõ]es)?|Compet[eê]ncias|Habilidades|Dados\s+Pessoais)\b)/gi,
    '\n',
  );

  return t.replace(/\n{3,}/g, '\n\n').trim();
}

function linesOf(text: string): string[] {
  return text
    .split('\n')
    .map((l) => normalizeSpaces(l))
    .filter(Boolean);
}

function detectSection(line: string): keyof typeof SECTION_HEADERS | null {
  if (/^[^:]{2,40}:\s+\S+/.test(line)) return null;
  const cleaned = line.replace(/[:\-–—|]+$/, '').trim();
  if (cleaned.length > 60) return null;
  for (const [key, re] of Object.entries(SECTION_HEADERS)) {
    if (re.test(cleaned)) return key as keyof typeof SECTION_HEADERS;
  }
  return null;
}

function splitSections(text: string): Record<string, string> {
  const lines = linesOf(text);
  const buckets: Record<string, string[]> = {
    header: [],
    experiencia: [],
    formacao: [],
    cursos: [],
    competencias: [],
    dados: [],
    outros: [],
  };
  let current: keyof typeof buckets = 'header';

  for (const line of lines) {
    const section = detectSection(line);
    if (section) {
      current = section;
      continue;
    }
    buckets[current].push(line);
  }

  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(buckets)) {
    out[k] = v.join('\n');
  }
  return out;
}

function extractEmails(text: string): string[] {
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const labeled = text.match(
    /(?:e-?mail|email|correo)\s*[:\-–]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
  );
  const found = new Set<string>();
  if (labeled?.[1]) found.add(labeled[1].toLowerCase());
  for (const m of text.match(re) || []) found.add(m.toLowerCase());
  return Array.from(found).slice(0, 3);
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

function formatPhoneBr(digits: string): string | null {
  let d = digits;
  if (d.startsWith('55') && d.length >= 12) d = d.slice(2);
  if (d.length === 10 || d.length === 11) {
    const ddd = d.slice(0, 2);
    const rest = d.slice(2);
    // DDD brasileiro 11–99
    const dddN = Number(ddd);
    if (dddN < 11 || dddN > 99) return null;
    if (rest.length === 9) {
      return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    }
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  return null;
}

function extractPhones(text: string): string[] {
  const found: string[] = [];
  const push = (raw: string) => {
    const formatted = formatPhoneBr(digitsOnly(raw));
    if (formatted && !found.includes(formatted)) found.push(formatted);
  };

  const labeled =
    text.matchAll(
      /(?:telefone|celular|whatsapp|fone|tel\.?|cel\.?|contato)\s*[:\-–]?\s*(\+?55\s*)?(\(?\d{2}\)?\s*)?(?:9\s*)?\d{4,5}[-.\s]?\d{4}/gi,
    ) || [];
  for (const m of labeled) push(m[0]);

  const loose =
    text.match(
      /(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)(?:9\s*)?\d{4,5}[-.\s]?\d{4}/g,
    ) || [];
  for (const m of loose) push(m);

  // Só dígitos seguidos (41999998877)
  const compact = text.match(/\b(?:55)?(?:\d{2})9?\d{8}\b/g) || [];
  for (const m of compact) push(m);

  return found.slice(0, 3);
}

function titleCaseCity(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => {
      if (/^(da|de|do|das|dos|e)$/i.test(w)) return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

function ufFromToken(raw: string): string | null {
  const plain = stripAccents(raw.toLowerCase())
    .replace(/[:.,;].*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return null;
  if (plain.length === 2 && UF_SET.has(plain.toUpperCase())) return plain.toUpperCase();
  if (UF_NOME_PARA_SIGLA[plain]) return UF_NOME_PARA_SIGLA[plain];
  const keys = Object.keys(UF_NOME_PARA_SIGLA).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (plain === key || plain.startsWith(`${key} `)) return UF_NOME_PARA_SIGLA[key];
  }
  return null;
}

function acceptCidade(cidade: string, uf: string): { cidade: string; estado: string } | null {
  const nome = titleCaseCity(normalizeSpaces(cidade).replace(/[-–,].*$/, ''));
  if (!UF_SET.has(uf)) return null;
  if (nome.length < 2 || nome.length > 40) return null;
  if (/email|telefone|whatsapp|cnh|cep|rua|av\.|avenida|linkedin|http|nasciment|idade/i.test(nome)) {
    return null;
  }
  if (/^(de|da|do|em|no|na|para|estado|cidade|uf)$/i.test(nome)) return null;
  return { cidade: nome, estado: uf };
}

function extractEstadoLabel(text: string): string | null {
  // Só a linha do rótulo (não engolir E-mail/Telefone da linha seguinte)
  const line = text.match(
    /(?:^|\n)\s*(?:estado|uf)\s*[:\-–]?\s*([A-Za-zÀ-ÿ]{2,}(?:\s+[A-Za-zÀ-ÿ]+){0,3})\s*(?=\n|$)/i,
  );
  if (line) return ufFromToken(line[1]);

  const inline = text.match(
    /(?:estado|uf)\s*[:\-–]\s*([A-Za-zÀ-ÿ]{2,}(?:\s+[A-Za-zÀ-ÿ]+){0,2})(?=\s{2,}|\s+(?:cidade|e-?mail|telefone|celular|cep|idade|nascimento)\b|[,\n]|$)/i,
  );
  return inline ? ufFromToken(inline[1]) : null;
}

function extractCidadeLabel(text: string): string | null {
  const linha = text.match(
    /(?:^|\n)\s*(?:cidade|munic[ií]pio|naturalidade)\s*[:\-–]?\s*\n\s*([A-Za-zÀ-ÿ'][A-Za-zÀ-ÿ' ]{1,40}?)\s*(?:\n|$)/i,
  );
  if (linha) return titleCaseCity(normalizeSpaces(linha[1]));

  const labeled = text.match(
    /(?:^|\n)\s*(?:cidade|munic[ií]pio|naturalidade|natural\s+de|residente\s+em|mora(?:ndo)?\s+em)\s*[:\-–]?\s*([A-Za-zÀ-ÿ'][A-Za-zÀ-ÿ' ]{1,40}?)\s*(?=\n|$)/i,
  );
  if (labeled) {
    return titleCaseCity(normalizeSpaces(labeled[1].replace(/[-–,].*$/, '')));
  }
  return null;
}

function extractCidadeEstado(text: string): { cidade: string | null; estado: string | null } {
  // Estado/cidade por rótulo primeiro (formato típico de currículo DOCX)
  let estado = extractEstadoLabel(text);
  let cidade = extractCidadeLabel(text);
  if (cidade) {
    const key = stripAccents(cidade.toLowerCase());
    return { cidade, estado: estado || CIDADE_UF_COMUM[key] || null };
  }

  // Curitiba/PR | Curitiba - PR | Curitiba, PR | Curitiba (PR)
  const patterns: RegExp[] = [
    /(?:cidade|munic[ií]pio|localidade|reside(?:ncia)?(?:\s+em)?|mora(?:ndo)?(?:\s+em)?|endere[cç]o)\s*[:\-–]?\s*([A-Za-zÀ-ÿ' ]{2,40}?)\s*[-–—,/|(]\s*([A-Za-z]{2})\)?/i,
    /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' ]{1,40}?)\s*[/|,]\s*([A-Za-z]{2})\b/,
    /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' ]{1,40}?)\s*[-–—]\s*([A-Za-z]{2})\b/,
    /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' ]{1,40}?)\s*\(\s*([A-Za-z]{2})\s*\)/,
    /\b([A-Za-z]{2})\s*[-–—,/]\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' ]{1,40})\b/,
  ];

  for (const re of patterns) {
    const flags = re.flags.includes('g') ? re : new RegExp(re.source, re.flags + 'g');
    let m: RegExpExecArray | null;
    const r = new RegExp(flags.source, flags.flags);
    while ((m = r.exec(text)) !== null) {
      let cidade = '';
      let uf = '';
      if (UF_SET.has(m[1].toUpperCase()) && m[2]) {
        uf = m[1].toUpperCase();
        cidade = normalizeSpaces(m[2]);
      } else {
        cidade = normalizeSpaces(m[1]);
        uf = m[2].toUpperCase();
      }
      const accepted = acceptCidade(cidade, uf);
      if (accepted) return accepted;
    }
  }

  // Curitiba - Paraná | São Paulo, Sao Paulo | Londrina/Parana (nome do estado por extenso)
  const stateAlt = Object.keys(UF_NOME_PARA_SIGLA)
    .sort((a, b) => b.length - a.length)
    .join('|');
  const plain = stripAccents(text);
  const byName = new RegExp(
    `([A-Za-z][A-Za-z' ]{2,40}?)\\s*[-–—/,]\\s*(${stateAlt})\\b`,
    'gi',
  );
  let nameMatch: RegExpExecArray | null;
  while ((nameMatch = byName.exec(plain)) !== null) {
    const uf = UF_NOME_PARA_SIGLA[nameMatch[2].toLowerCase()];
    const accepted = uf ? acceptCidade(nameMatch[1], uf) : null;
    if (accepted) return accepted;
  }

  const headerLines = linesOf(text).slice(0, 25);
  for (let i = 0; i < headerLines.length; i += 1) {
    const line = stripAccents(headerLines[i]);
    const sameLine = line.match(
      new RegExp(`^([A-Za-z][A-Za-z' ]{2,40}?)\\s+([A-Z]{2}|(?:${stateAlt}))$`, 'i'),
    );
    if (sameLine) {
      const uf = ufFromToken(sameLine[2]);
      const accepted = uf ? acceptCidade(sameLine[1], uf) : null;
      if (accepted) return accepted;
    }
    if (i + 1 < headerLines.length) {
      const uf = ufFromToken(headerLines[i + 1]);
      if (uf && !ufFromToken(headerLines[i]) && !/\d|@/.test(headerLines[i])) {
        const accepted = acceptCidade(headerLines[i], uf);
        if (accepted) return accepted;
      }
    }
  }

  // Endereço longo: "... - Cidade/UF - CEP"
  const endereco = text.match(
    /(?:endere[cç]o|resid[eê]ncia)\s*[:\-–]?\s*[^\n]{0,120}?([A-Za-zÀ-ÿ'][A-Za-zÀ-ÿ' ]{2,40}?)\s*[/|-]\s*([A-Za-z]{2})\b/i,
  );
  if (endereco) {
    const accepted = acceptCidade(endereco[1], endereco[2].toUpperCase());
    if (accepted) return { ...accepted, estado: accepted.estado || estado };
  }

  // Cidade conhecida sozinha no cabeçalho
  const lower = stripAccents(text.toLowerCase());
  for (const [cidadeKey, uf] of Object.entries(CIDADE_UF_COMUM)) {
    if (cidadeKey === 'joao') continue;
    if (new RegExp(`(?:^|\\n|[,;|/])\\s*${cidadeKey}\\b`, 'i').test(lower)) {
      return { cidade: titleCaseCity(cidadeKey), estado: estado || uf };
    }
  }

  return { cidade: null, estado };
}

function looksLikePersonName(line: string): boolean {
  if (line.length < 5 || line.length > 80) return false;
  if (SKIP_NAME_LINES.test(line)) return false;
  if (/@|\d{3,}|https?:|www\.|linkedin/i.test(line)) return false;
  if (!/^[A-Za-zÀ-ÿ]/.test(line)) return false;
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 7) return false;
  const titleCaseish = words.filter(
    (w) => /^[A-ZÀ-Ÿ]/.test(w) || /^(da|de|do|das|dos|e)$/i.test(w),
  );
  return titleCaseish.length >= Math.min(2, words.length);
}

function extractNome(headerText: string, fullText: string): string | null {
  const labeled = fullText.match(
    /(?:nome\s+completo|nome)\s*[:\-–]\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' ]{4,70})/i,
  );
  if (labeled && looksLikePersonName(normalizeSpaces(labeled[1]))) {
    return normalizeSpaces(labeled[1]);
  }

  for (const line of linesOf(headerText).slice(0, 10)) {
    if (looksLikePersonName(line)) return line;
  }
  for (const line of linesOf(fullText).slice(0, 15)) {
    if (looksLikePersonName(line)) return line;
  }
  return null;
}

function matchEscolaridade(text: string): string | null {
  const lower = stripAccents(text.toLowerCase());
  const rules: Array<{ re: RegExp; value: (typeof ESCOLARIDADES_OPCOES)[number] }> = [
    { re: /\bmba\b/, value: 'MBA' },
    { re: /\bpos[-\s]?gradua/, value: 'Pós-graduação' },
    { re: /\bmestrado\b|\bdoutorado\b|\bspecializ/, value: 'Pós-graduação' },
    { re: /\bsuperior\s+completo\b|\bbacharel(?:ado)?\b|\blicenciatura\b|\bgraduacao\s+completa\b/, value: 'Superior completo' },
    { re: /\bsuperior\s+incompleto\b|\bcursando\s+(?:o\s+)?superior\b|\bgraduacao\s+incompleta\b/, value: 'Superior incompleto' },
    { re: /\btecnico\b|\bcurso\s+tecnico\b/, value: 'Técnico' },
    { re: /\bmedio\s+completo\b|\bensino\s+medio\s+completo\b|\b2[oº]\s*grau\s+completo\b/, value: 'Médio completo' },
    { re: /\bmedio\s+incompleto\b|\bensino\s+medio\s+incompleto\b/, value: 'Médio incompleto' },
    { re: /\bfundamental\s+completo\b|\b1[oº]\s*grau\s+completo\b/, value: 'Fundamental completo' },
    { re: /\bfundamental\s+incompleto\b/, value: 'Fundamental incompleto' },
  ];
  for (const rule of rules) {
    if (rule.re.test(lower)) return rule.value;
  }
  return null;
}

function extractFormacaoDetails(section: string): {
  formacao: string[];
  cursoFormacao: string | null;
  instituicao: string | null;
  ano: string | null;
  escolaridade: string | null;
} {
  const lines = linesOf(section);
  const formacao = lines.filter((l) => l.length > 3 && l.length < 120).slice(0, 8);
  const escolaridade = matchEscolaridade(section || formacao.join('\n'));

  let cursoFormacao: string | null = null;
  let instituicao: string | null = null;
  let ano: string | null = null;

  const cursoMatch = section.match(
    /(?:curso|gradua[cç][aã]o|tecn[oó]logo(?:\s+em)?|bacharel(?:ado)?(?:\s+em)?|licenciatura(?:\s+em)?)\s*[:\-–]?\s*([^\n,]{3,80})/i,
  );
  if (cursoMatch) cursoFormacao = normalizeSpaces(cursoMatch[1]).replace(/\s+\d{4}.*$/, '');

  const instMatch = section.match(
    /(?:institui[cç][aã]o|faculdade|universidade|escola|senai|senac|sesi)\s*[:\-–]?\s*([^\n,]{2,80})/i,
  );
  if (instMatch) {
    instituicao = normalizeSpaces(instMatch[1]);
  } else {
    const known = section.match(/\b(SENAI|SENAC|SESI|UF[A-Z]{2}|UTFPR|USP|UNICAMP|UFRJ|UFMG)[^\n,]{0,40}/i);
    if (known) instituicao = normalizeSpaces(known[0]);
  }

  const anoMatch =
    section.match(/(?:conclus[aã]o|ano|formado(?:a)?(?:\s+em)?)\s*[:\-–]?\s*((?:19|20)\d{2})/i) ||
    section.match(/\b((?:19|20)\d{2})\b/);
  if (anoMatch) ano = anoMatch[1];

  if (!cursoFormacao && formacao[0] && !matchEscolaridade(formacao[0])) {
    cursoFormacao = formacao[0].slice(0, 80);
  }

  return { formacao, cursoFormacao, instituicao, ano, escolaridade };
}

function parsePeriodo(line: string): { inicio: string; fim: string; label: string } | null {
  const m = line.match(
    /(\d{2}\/\d{4}|\d{4})\s*[-–—aà]+\s*(\d{2}\/\d{4}|\d{4}|atual|presente|hoje)/i,
  );
  if (!m) return null;
  const toIsoish = (v: string) => {
    if (/atual|presente|hoje/i.test(v)) return '';
    if (/^\d{4}$/.test(v)) return `${v}-01`;
    const [mm, yyyy] = v.split('/');
    return `${yyyy}-${mm}`;
  };
  return { inicio: toIsoish(m[1]), fim: toIsoish(m[2]), label: normalizeSpaces(m[0]) };
}

type ExpItem = NonNullable<ResumeStructuredFields['experiencias']>[number] & {
  dataInicio?: string | null;
  dataFim?: string | null;
};

function extractExperiencias(section: string): ExpItem[] {
  const lines = linesOf(section);
  const items: ExpItem[] = [];
  let current: ExpItem | null = null;

  const flush = () => {
    if (!current) return;
    if (current.empresa || current.cargo) items.push(current);
    current = null;
  };

  for (const line of lines) {
    const pipe = line.match(/^(.+?)\s*[|–—]\s*(.+?)\s*[|–—]\s*(.+)$/);
    if (pipe) {
      flush();
      const periodo = parsePeriodo(pipe[3]);
      items.push({
        cargo: normalizeSpaces(pipe[1]),
        empresa: normalizeSpaces(pipe[2]),
        periodo: periodo?.label || normalizeSpaces(pipe[3]),
        dataInicio: periodo?.inicio || null,
        dataFim: periodo?.fim || null,
        descricao: null,
      });
      continue;
    }

    const empLabel = line.match(/^(?:empresa|companhia)\s*[:\-–]\s*(.+)$/i);
    const cargoLabel = line.match(/^(?:cargo|fun[cç][aã]o|posto)\s*[:\-–]\s*(.+)$/i);
    const periodo = parsePeriodo(line);

    if (empLabel) {
      if (current?.empresa && current?.cargo) flush();
      if (!current) current = {};
      current.empresa = normalizeSpaces(empLabel[1]);
      continue;
    }
    if (cargoLabel) {
      if (!current) current = {};
      current.cargo = normalizeSpaces(cargoLabel[1]);
      continue;
    }
    if (periodo) {
      if (!current) current = {};
      current.periodo = periodo.label;
      current.dataInicio = periodo.inicio;
      current.dataFim = periodo.fim;
      continue;
    }

    if (/^(atividades|responsabilidades|descri)/i.test(line)) continue;

    if (!current) {
      current = { empresa: line };
    } else if (!current.cargo && line.length < 80) {
      current.cargo = line;
    } else {
      current.descricao = [current.descricao, line].filter(Boolean).join(' ').slice(0, 500);
    }
  }
  flush();
  return items.slice(0, 8);
}

function extractCursos(section: string, fullText: string): string[] {
  const source = section || fullText;
  const found = new Set<string>();

  for (const curso of CURSOS_INDUSTRIAIS_SUGERIDOS) {
    const needle = stripAccents(curso.toLowerCase());
    if (stripAccents(source.toLowerCase()).includes(needle.slice(0, Math.min(needle.length, 24)))) {
      found.add(curso);
    }
  }

  const nrs = source.match(/\bNR[-\s]?(\d{1,2})\b/gi) || [];
  for (const nr of nrs) {
    const num = nr.replace(/\D/g, '');
    const mapped = CURSOS_INDUSTRIAIS_SUGERIDOS.find((c) => c.includes(`NR-${num}`));
    if (mapped) found.add(mapped);
    else found.add(`NR-${num}`);
  }

  for (const line of linesOf(section)) {
    if (line.length >= 4 && line.length <= 90 && !detectSection(line)) {
      if (/curso|certific|treinamento|capacita|workshop|nr-/i.test(line) || /^[A-ZÀ-Ÿ0-9]/.test(line)) {
        found.add(line.replace(/^[-•*]\s*/, '').slice(0, 90));
      }
    }
    if (found.size >= 12) break;
  }

  return Array.from(found).slice(0, 12);
}

function matchOptionList(text: string, options: readonly string[]): string[] {
  const lower = stripAccents(text.toLowerCase());
  const hits: string[] = [];
  for (const opt of options) {
    const needle = stripAccents(opt.toLowerCase());
    if (needle.length >= 2 && lower.includes(needle)) hits.push(opt);
  }
  return hits;
}

function extractCnh(text: string): string | null {
  const labeled = text.match(
    /(?:cnh|carteira\s+nacional(?:\s+de\s+habilita[cç][aã]o)?|habilita[cç][aã]o)\s*[:\-–]?\s*(?:categoria\s*)?([A-E]{1,2})\b/i,
  );
  if (labeled) {
    const cat = labeled[1].toUpperCase();
    if ((CNH_CATEGORIAS as readonly string[]).includes(cat)) return cat;
  }
  const catOnly = text.match(/\bcategoria\s+([A-E]{1,2})\b/i);
  if (catOnly) {
    const cat = catOnly[1].toUpperCase();
    if ((CNH_CATEGORIAS as readonly string[]).includes(cat)) return cat;
  }
  return null;
}

const MESES_PT: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

function idadeFromDate(day: number, month: number, year: number): string | null {
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1940 || year > new Date().getFullYear() - 14) {
    return null;
  }
  const birth = new Date(year, month - 1, day);
  if (birth.getDate() !== day || birth.getMonth() !== month - 1) return null;
  const today = new Date();
  let idade = today.getFullYear() - year;
  const md = today.getMonth() - (month - 1);
  if (md < 0 || (md === 0 && today.getDate() < day)) idade -= 1;
  if (idade < 14 || idade > 80) return null;
  return String(idade);
}

/** Idade escrita sem data (Idade: 34 / 34 anos). */
function extractIdadeSolta(text: string): string | null {
  const labeled = text.match(/(?:^|\n|\s)idade\s*[:\-–]?\s*(\d{2})\b/i);
  const anos = text.match(/\b(\d{2})\s+anos\b/i);
  const n = Number(labeled?.[1] || anos?.[1]);
  if (!n || n < 14 || n > 80) return null;
  return String(n);
}

function extractDataNascimento(text: string): {
  display: string | null;
  iso: string | null;
  idade: string | null;
} {
  const porExtenso = text.match(
    /(?:data\s+de\s+nascimento|nascimento|nasc\.?|nascido(?:a)?\s+em|dt\.?\s*nasc\.?)?\s*[:\-–]?\s*(\d{1,2})\s+de\s+(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+((?:19|20)\d{2})/i,
  );
  if (porExtenso) {
    const day = Number(porExtenso[1]);
    const month = MESES_PT[stripAccents(porExtenso[2].toLowerCase())];
    const year = Number(porExtenso[3]);
    const idade = month ? idadeFromDate(day, month, year) : null;
    if (idade && month) {
      const display = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { display, iso, idade };
    }
  }

  const labeled = text.match(
    /(?:data\s+de\s+nascimento|nascimento|nasc\.?|nascido(?:a)?\s+em|born|birthday|dt\.?\s*nasc\.?)\s*[:\-–]?\s*(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/i,
  );
  const loose = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-]((?:19|20)\d{2})\b/);
  const m = labeled || loose;
  if (!m) return { display: null, iso: null, idade: null };

  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const idade = idadeFromDate(day, month, year);
  if (!idade) return { display: null, iso: null, idade: null };

  // Se veio de match "loose" sem rótulo, evita confundir com datas de experiência (anos recentes de trabalho)
  if (!labeled) {
    const around = text.slice(Math.max(0, (loose?.index || 0) - 40), (loose?.index || 0) + 40);
    if (/(empresa|cargo|experiencia|periodo|de\s+\d{2}\/\d{4}|até|ate)/i.test(around) && year > 2005) {
      return { display: null, iso: null, idade: null };
    }
  }

  const display = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { display, iso, idade };
}

export type ResumePatternParseResult = ResumeStructuredFields & {
  escolaridade?: string | null;
  cursoFormacao?: string | null;
  instituicaoFormacao?: string | null;
  anoConclusaoFormacao?: string | null;
  maquinasEquipamentos?: string[];
  qualidadeProcessos?: string[];
  informatica?: string[];
  matchedFields: string[];
};

export function parseResumePatterns(rawText: string): ResumePatternParseResult {
  const text = preprocessResumeText(rawText || '');
  const sections = splitSections(text);
  const headerBlob = [sections.header, sections.dados].filter(Boolean).join('\n') || text.slice(0, 1800);

  const emails = extractEmails(text);
  const phonesHeader = extractPhones(headerBlob);
  const phones = phonesHeader.length ? phonesHeader : extractPhones(text);
  const locHeader = extractCidadeEstado(headerBlob);
  const locFull = extractCidadeEstado(text);
  const locFallback = {
    cidade: locHeader.cidade || locFull.cidade,
    estado: locHeader.estado || locFull.estado,
  };
  const nome = extractNome(headerBlob, text);
  const nasc = extractDataNascimento(headerBlob);
  const nascFinal = nasc.display ? nasc : extractDataNascimento(text);
  const idadeFinal =
    nascFinal.idade || extractIdadeSolta(headerBlob) || extractIdadeSolta(text);

  const formacaoInfo = extractFormacaoDetails(
    sections.formacao || (matchEscolaridade(text) ? text : ''),
  );
  if (!formacaoInfo.escolaridade) {
    formacaoInfo.escolaridade = matchEscolaridade(text);
  }

  const expFinal =
    sections.experiencia.trim().length > 0
      ? extractExperiencias(sections.experiencia)
      : [];

  const cursos = extractCursos(sections.cursos, text);
  const cnh = extractCnh(text);

  const skillBlob = [sections.competencias, sections.cursos, text].join('\n');
  const maquinasEquipamentos = matchOptionList(skillBlob, MAQUINAS_EQUIPAMENTOS);
  const qualidadeProcessos = matchOptionList(skillBlob, QUALIDADE_PROCESSOS);
  const informatica = matchOptionList(skillBlob, INFORMATICA_OPCOES);
  const competencias = Array.from(
    new Set([...maquinasEquipamentos, ...qualidadeProcessos, ...informatica, ...cursos.slice(0, 5)]),
  );

  const matchedFields: string[] = [];
  if (nome) matchedFields.push('nome');
  if (nascFinal.display) matchedFields.push('dataNascimento');
  if (idadeFinal) matchedFields.push('idade');
  if (emails[0]) matchedFields.push('email');
  if (phones[0]) matchedFields.push('telefone');
  if (phones[1]) matchedFields.push('telefone2');
  if (locFallback.cidade) matchedFields.push('cidade');
  if (locFallback.estado) matchedFields.push('estado');
  if (formacaoInfo.escolaridade) matchedFields.push('escolaridade');
  if (formacaoInfo.cursoFormacao) matchedFields.push('cursoFormacao');
  if (formacaoInfo.instituicao) matchedFields.push('instituicaoFormacao');
  if (formacaoInfo.ano) matchedFields.push('anoConclusaoFormacao');
  if (expFinal.length) matchedFields.push('experiencias');
  if (cursos.length) matchedFields.push('cursos');
  if (maquinasEquipamentos.length || qualidadeProcessos.length || informatica.length) {
    matchedFields.push('competencias');
  }
  if (cnh) matchedFields.push('cnh');

  return {
    nome,
    dataNascimentoDisplay: nascFinal.display,
    dataNascimento: nascFinal.iso,
    idade: idadeFinal,
    contato: {
      email: emails[0] || null,
      telefone: phones[0] || null,
      telefone2: phones[1] || null,
      whatsapp: phones[0] ? 'Sim' : null,
    },
    cidade: locFallback.cidade,
    estado: locFallback.estado,
    formacao: formacaoInfo.formacao.length ? formacaoInfo.formacao : null,
    experiencias: expFinal.length
      ? expFinal.map((e) => ({
          empresa: e.empresa || null,
          cargo: e.cargo || null,
          periodo: e.periodo || null,
          descricao: e.descricao || null,
          dataInicio: e.dataInicio || null,
          dataFim: e.dataFim || null,
        }))
      : null,
    cursos: cursos.length ? cursos : null,
    competencias: competencias.length ? competencias : null,
    cnh,
    escolaridade: formacaoInfo.escolaridade,
    cursoFormacao: formacaoInfo.cursoFormacao,
    instituicaoFormacao: formacaoInfo.instituicao,
    anoConclusaoFormacao: formacaoInfo.ano,
    maquinasEquipamentos,
    qualidadeProcessos,
    informatica,
    matchedFields,
  };
}
