import { describe, expect, it } from "vitest";
import {
  CurriculoAnexadoSemLeituraError,
  mensagemComAnexo,
} from "@/lib/curriculum/resume-read-error";

describe("mensagemComAnexo", () => {
  it("avisa que o arquivo e os dados digitados permanecem", () => {
    const texto = mensagemComAnexo("Este PDF não tem texto selecionável.");
    expect(texto).toMatch(/continua anexado/);
    expect(texto).toMatch(/dados já digitados foram mantidos/);
  });

  it("não repete o aviso quando a mensagem já fala do anexo", () => {
    const texto = mensagemComAnexo("Arquivo anexado. Complete manualmente.");
    expect(texto).toBe("Arquivo anexado. Complete manualmente.");
  });

  it("marca a falha que preserva o arquivo", () => {
    const erro = new CurriculoAnexadoSemLeituraError(mensagemComAnexo("Falha de rede."));
    expect(erro.arquivoMantido).toBe(true);
    expect(erro.message).toMatch(/continua anexado/);
  });
});
