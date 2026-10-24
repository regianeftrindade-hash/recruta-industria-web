import type { ResumeExtractionResult } from "@/lib/curriculum/types";

/** A leitura falhou, mas o arquivo selecionado deve permanecer anexado. */
export class CurriculoAnexadoSemLeituraError extends Error {
  readonly arquivoMantido = true;

  constructor(message: string) {
    super(message);
    this.name = "CurriculoAnexadoSemLeituraError";
  }
}

export function mensagemComAnexo(message: string): string {
  const texto = message.trim() || "Não foi possível ler o currículo.";
  if (/anexad/i.test(texto)) return texto;
  return `${texto} O arquivo continua anexado e os dados já digitados foram mantidos.`;
}

/**
 * Pede a extração no servidor. Não envia o arquivo para o armazenamento do perfil.
 * Erro 400 rejeita o arquivo. As demais falhas mantêm o anexo.
 */
export async function requestResumeExtract(file: File): Promise<ResumeExtractionResult> {
  const nome = file.name.toLowerCase();
  if (!nome.endsWith(".pdf") && !nome.endsWith(".docx") && !nome.endsWith(".doc")) {
    throw new Error("Envie um arquivo PDF ou DOCX.");
  }
  if (!file.size) throw new Error("O arquivo está vazio.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Arquivo muito grande (máx. 8MB).");

  let response: Response;
  try {
    const body = new FormData();
    body.set("file", file);
    response = await fetch("/api/professional/curriculum/extract", {
      method: "POST",
      body,
      credentials: "include",
    });
  } catch {
    throw new CurriculoAnexadoSemLeituraError(
      mensagemComAnexo("Não foi possível ler o currículo agora."),
    );
  }

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    extraction?: ResumeExtractionResult;
  };
  if (!response.ok || !data.extraction) {
    const mensagem =
      typeof data.error === "string" && data.error.trim()
        ? data.error
        : "Não foi possível ler o currículo.";
    if (response.status === 400) throw new Error(mensagem);
    throw new CurriculoAnexadoSemLeituraError(mensagemComAnexo(mensagem));
  }

  return data.extraction;
}
