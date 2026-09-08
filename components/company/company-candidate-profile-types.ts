export type Tracking = {
  contatado: boolean;
  entrevistado: boolean;
  emTeste: boolean;
  contratado: boolean;
  naoContratado: boolean;
  notes: string;
};

export type Resumo = {
  id: string;
  nome: string;
  cargo?: string;
  area?: string;
  local?: string;
  escolaridade?: string;
  turno?: string;
  experiencia?: string;
  bloqueado: boolean;
  favorito?: boolean;
  compatibilidade?: number;
  profileCompletion?: number;
  avatar?: string | null;
  curriculoURL?: string | null;
  segmentosIndustria?: string[];
  maquinasEquipamentos?: string[];
};

export type DocumentoAnexo = {
  label: string;
  url: string;
};

export type CompanyCandidateProfilePanelProps = {
  profileId: string;
  onBack: () => void;
  onUnlocked?: () => void;
};
