import { describe, expect, it } from "vitest";
import { formatReaisDisplay, maskReaisInput, turnoPropostaLabel } from "@/lib/format-reais";
import { limiteRetencaoInbox, RETENCAO_MENSAGENS_DICAS_MESES } from "@/lib/profile/inbox-retention";

describe("proposta — reais e turno", () => {
  it("máscara e exibição", () => {
    expect(maskReaisInput("4200")).toBe("R$ 4.200");
    expect(formatReaisDisplay("4200")).toMatch(/^R\$/);
    expect(formatReaisDisplay("R$ 1.000")).toBe("R$ 1.000");
  });

  it("rótulo de turno da proposta", () => {
    expect(turnoPropostaLabel("1º Turno")).toBe("Primeiro turno");
    expect(turnoPropostaLabel("")).toBe("—");
  });
});

describe("retenção de inbox / propostas", () => {
  it("limite é 1 mês atrás", () => {
    expect(RETENCAO_MENSAGENS_DICAS_MESES).toBe(1);
    const limite = limiteRetencaoInbox();
    const agora = new Date();
    const diffDias = (agora.getTime() - limite.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDias).toBeGreaterThan(27);
    expect(diffDias).toBeLessThan(33);
  });
});
