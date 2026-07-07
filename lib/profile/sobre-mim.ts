export interface SobreMimData {
  hobbys: string;
  estiloMusical: string;
  livros: string;
  filmesSeries: string;
  fraseQueDefine: string;
  assuntosInteresse: string;
}

export const SOBRE_MIM_VAZIO: SobreMimData = {
  hobbys: "",
  estiloMusical: "",
  livros: "",
  filmesSeries: "",
  fraseQueDefine: "",
  assuntosInteresse: "",
};

export const SOBRE_MIM_LIMITES: Record<keyof SobreMimData, number> = {
  hobbys: 80,
  estiloMusical: 60,
  livros: 80,
  filmesSeries: 80,
  fraseQueDefine: 120,
  assuntosInteresse: 100,
};

export function truncarSobreMim(data: SobreMimData): SobreMimData {
  return {
    hobbys: data.hobbys.slice(0, SOBRE_MIM_LIMITES.hobbys),
    estiloMusical: data.estiloMusical.slice(0, SOBRE_MIM_LIMITES.estiloMusical),
    livros: data.livros.slice(0, SOBRE_MIM_LIMITES.livros),
    filmesSeries: data.filmesSeries.slice(0, SOBRE_MIM_LIMITES.filmesSeries),
    fraseQueDefine: data.fraseQueDefine.slice(0, SOBRE_MIM_LIMITES.fraseQueDefine),
    assuntosInteresse: data.assuntosInteresse.slice(0, SOBRE_MIM_LIMITES.assuntosInteresse),
  };
}

export function parseSobreMimJSON(raw: string | null | undefined): SobreMimData {
  if (!raw?.trim()) return { ...SOBRE_MIM_VAZIO };
  try {
    const parsed = JSON.parse(raw) as Partial<SobreMimData>;
    return truncarSobreMim({
      hobbys: String(parsed.hobbys ?? ""),
      estiloMusical: String(parsed.estiloMusical ?? ""),
      livros: String(parsed.livros ?? ""),
      filmesSeries: String(parsed.filmesSeries ?? ""),
      fraseQueDefine: String(parsed.fraseQueDefine ?? ""),
      assuntosInteresse: String(parsed.assuntosInteresse ?? ""),
    });
  } catch {
    return { ...SOBRE_MIM_VAZIO };
  }
}

export function serializeSobreMim(data: SobreMimData): string {
  const t = truncarSobreMim(data);
  return JSON.stringify({
    hobbys: t.hobbys.trim(),
    estiloMusical: t.estiloMusical.trim(),
    livros: t.livros.trim(),
    filmesSeries: t.filmesSeries.trim(),
    fraseQueDefine: t.fraseQueDefine.trim(),
    assuntosInteresse: t.assuntosInteresse.trim(),
  });
}
