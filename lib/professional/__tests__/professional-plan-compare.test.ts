import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { professionalPlanCompare } from "@/lib/professional/professional-plan-compare";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined }),
}));

describe("comparação dos planos do profissional", () => {
  it("mostra Gratuito e Premium com o preço já definido", () => {
    const { free, premium } = professionalPlanCompare();
    expect(free.id).toBe("FREE");
    expect(free.precoCentavos).toBe(0);
    expect(premium.id).toBe("PREMIUM");
    expect(premium.preco).toBe("R$ 19,90");
    expect(premium.precoCentavos).toBe(1990);
  });

  it("coloca no Premium o que o gratuito já tem e o que só o Premium libera", () => {
    const { rows } = professionalPlanCompare();
    const byItem = new Map(rows.map((row) => [row.item, row]));

    expect(byItem.get("Perfil na vitrine para empresas")).toEqual({
      item: "Perfil na vitrine para empresas",
      free: true,
      premium: true,
    });
    expect(byItem.get("Busca de vagas")?.free).toBe(true);
    expect(byItem.get("Vagas compatíveis com o seu perfil")).toEqual({
      item: "Vagas compatíveis com o seu perfil",
      free: false,
      premium: true,
    });
    expect(byItem.get("Lista de empresas identificadas que visualizaram seu perfil")?.free).toBe(false);
    expect(rows.some((row) => row.item === "Todas as funcionalidades do plano gratuito")).toBe(false);
  });

  it("mostra preço, comparação e contratação na aba do profissional", async () => {
    const { default: ProfessionalMeuPlano } = await import("@/components/professional/ProfessionalMeuPlano");
    const html = renderToStaticMarkup(
      createElement(ProfessionalMeuPlano, {
        initialSnapshot: { isPremium: false, subscriptionExpiresAt: null, latestCharge: null },
      }),
    );
    expect(html).toContain("Planos para Profissionais");
    expect(html).toContain("R$ 19,90");
    expect(html).toContain("Comparação");
    expect(html).toContain("Contratação");
    expect(html).toContain("Pix ou boleto");
    expect(html).toContain("Pagar e assinar Premium");
    expect(html).toContain("Vagas compatíveis com o seu perfil");
    expect(html).toContain("Lista de empresas identificadas que visualizaram seu perfil");
  });
});
