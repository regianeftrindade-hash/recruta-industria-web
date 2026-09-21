/**
 * Tipos da importação de currículo.
 * `structured` é preenchido por padrões (heurísticas); IA pode refinar depois.
 */

export type ResumeStructuredFields = {
  nome?: string | null;
  contato?: {
    email?: string | null;
    telefone?: string | null;
    telefone2?: string | null;
    whatsapp?: string | null;
  } | null;
  cidade?: string | null;
  estado?: string | null;
  formacao?: string[] | null;
  experiencias?: Array<{
    empresa?: string | null;
    cargo?: string | null;
    periodo?: string | null;
    descricao?: string | null;
    dataInicio?: string | null;
    dataFim?: string | null;
  }> | null;
  cursos?: string[] | null;
  competencias?: string[] | null;
  cnh?: string | null;
  /** Data de nascimento em DD/MM/AAAA (exibição). */
  dataNascimentoDisplay?: string | null;
  /** Data de nascimento ISO YYYY-MM-DD. */
  dataNascimento?: string | null;
  idade?: string | null;
  /** Extras alinhados ao formulário (preenchimento por padrões). */
  escolaridade?: string | null;
  cursoFormacao?: string | null;
  instituicaoFormacao?: string | null;
  anoConclusaoFormacao?: string | null;
  maquinasEquipamentos?: string[] | null;
  qualidadeProcessos?: string[] | null;
  informatica?: string[] | null;
  matchedFields?: string[] | null;
};

export type ResumeExtractionResult = {
  sourceFileName: string;
  mimeType: string;
  format: 'pdf' | 'docx' | 'doc';
  rawText: string;
  charCount: number;
  extractedAt: string;
  /** Campos detectados por padrões (sem IA). */
  structured: ResumeStructuredFields | null;
};

export const RESUME_MAX_BYTES = 8 * 1024 * 1024;

export const RESUME_ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type ResumeAllowedMime = (typeof RESUME_ALLOWED_MIME)[number];
