import { describe, expect, it } from "vitest";
import { chaveDoDia, inicioDoDia, limitesDoPainel, ultimosDias } from "@/lib/admin/admin-day";

describe("dia do painel no horário de Brasília", () => {
  it("fecha o dia das 00:00 às 23:59 mesmo quando o relógio UTC já virou", () => {
    const agora = new Date("2026-10-25T02:40:00.000Z");
    expect(chaveDoDia(agora)).toBe("2026-10-24");
    const { inicioHoje, fimHoje } = limitesDoPainel(agora);
    expect(inicioHoje.toISOString()).toBe("2026-10-24T03:00:00.000Z");
    expect(fimHoje.toISOString()).toBe("2026-10-25T03:00:00.000Z");
  });

  it("começa o dia novo à meia-noite de Brasília", () => {
    const agora = new Date("2026-10-24T03:00:00.000Z");
    expect(chaveDoDia(agora)).toBe("2026-10-24");
    expect(inicioDoDia(agora).toISOString()).toBe("2026-10-24T03:00:00.000Z");
  });

  it("a semana e o mês também abrem à meia-noite de Brasília", () => {
    const agora = new Date("2026-10-25T02:40:00.000Z");
    const { inicioSemana, inicioMes } = limitesDoPainel(agora);
    expect(inicioSemana.toISOString()).toBe("2026-10-18T03:00:00.000Z");
    expect(inicioMes.toISOString()).toBe("2026-10-01T03:00:00.000Z");
    expect(ultimosDias(3, agora)).toEqual(["2026-10-22", "2026-10-23", "2026-10-24"]);
  });
});
