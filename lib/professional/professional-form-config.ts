export const PREFIRO_NAO_INFORMAR = 'Prefiro não informar';

export const SEGMENTOS_INDUSTRIA = [
  'Metalúrgica',
  'Automotiva',
  'Alimentícia',
  'Logística',
  'Farmacêutica',
  'Plástico',
  'Papel e Celulose',
  'Construção Civil',
] as const;

export const MAQUINAS_EQUIPAMENTOS = [
  'CNC',
  'Centro de Usinagem',
  'Torno Convencional',
  'Injetora',
  'Prensa',
  'Empilhadeira',
  'Ponte Rolante',
  'Outros',
] as const;

export const QUALIDADE_PROCESSOS = [
  'ISO 9001',
  'IATF 16949',
  'CEP',
  'FMEA',
  'MASP',
  '5S',
  'Ishikawa',
  'Pareto',
  'Lean Manufacturing',
  'Kaizen',
] as const;

export const INFORMATICA_OPCOES = [
  'Excel Básico',
  'Excel Intermediário',
  'Excel Avançado',
  'SAP',
  'TOTVS',
  'ERP Outros',
] as const;

export const CNH_CATEGORIAS = ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'] as const;

export type { ProfileCompletionInput } from '@/lib/profile-completion';
export {
  calculateProfileCompletion,
  getCompletionLabel,
  getCompletionMilestone,
} from '@/lib/profile-completion';
