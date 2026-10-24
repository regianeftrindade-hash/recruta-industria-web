import { describe, expect, it } from "vitest";
import { describeApplyPanel } from "@/lib/jobs/application-access";
import { hrefForShownContact, linkifyJobText } from "@/lib/jobs/job-text-links";

function linksOf(text: string) {
  return linkifyJobText(text).filter((part) => part.type === "link");
}

describe("linkifyJobText", () => {
  it("torna e-mail, link e WhatsApp clicáveis e preserva o texto", () => {
    const text = [
      "Envie o currículo para recrutamento@empresa.com.br.",
      "Formulário: https://contratoimediato.com/auxiliar-de-producao-na-cic-8/",
      "WhatsApp (15) 99739-3487",
      "Telefone (16) 2310-1118",
      "Prazo até 30/10/2026. Salário de R$ 2.600,00.",
    ].join("\n");

    const parts = linkifyJobText(text);
    expect(parts.map((part) => part.value).join("")).toBe(text);

    const links = parts.filter((part) => part.type === "link");
    expect(links).toEqual([
      { type: "link", value: "recrutamento@empresa.com.br", href: "mailto:recrutamento@empresa.com.br" },
      {
        type: "link",
        value: "https://contratoimediato.com/auxiliar-de-producao-na-cic-8/",
        href: "https://contratoimediato.com/auxiliar-de-producao-na-cic-8/",
      },
      { type: "link", value: "(15) 99739-3487", href: "https://wa.me/5515997393487" },
      { type: "link", value: "(16) 2310-1118", href: "tel:+551623101118" },
    ]);
  });

  it("abre o WhatsApp quando o número está identificado como WhatsApp", () => {
    expect(linksOf("Chama no zap 16 2310-1118")).toEqual([
      { type: "link", value: "16 2310-1118", href: "https://wa.me/551623101118" },
    ]);
    expect(linksOf("WhatsApp 15997393487")[0]).toMatchObject({
      href: "https://wa.me/5515997393487",
    });
    expect(linksOf("+55 (11) 98888-7777")[0]?.href).toBe("https://wa.me/5511988887777");
  });

  it("completa www e wa.me e ignora javascript e senha na URL", () => {
    expect(linksOf("site www.empresa.com.br/vaga.")[0]).toMatchObject({
      value: "www.empresa.com.br/vaga",
      href: "https://www.empresa.com.br/vaga",
    });
    expect(linksOf("wa.me/5515997393487")[0]?.href).toBe("https://wa.me/5515997393487");
    expect(linksOf("javascript:alert(1)")).toEqual([]);
    expect(linksOf("https://user:senha@empresa.com/vaga")).toEqual([]);
  });

  it("não transforma data, salário nem código solto em link", () => {
    expect(linksOf("até 30/10/2026")).toEqual([]);
    expect(linksOf("R$ 2.600,00 por mês")).toEqual([]);
    expect(linksOf("código 3593163")).toEqual([]);
    expect(linksOf("11988887777")).toEqual([]);
    expect(linksOf("IND-2026-0001")).toEqual([]);
    expect(linksOf("11 2026-1234")).toEqual([]);
    expect(linksOf("Telefone 16 2310-1118")[0]?.href).toBe("tel:+551623101118");
  });
});

describe("hrefForShownContact", () => {
  it("gera mailto, WhatsApp e site sem alterar o painel da candidatura", () => {
    expect(hrefForShownContact("email", "rh@empresa.example")).toBe(
      "mailto:rh@empresa.example?subject=Candidatura%20via%20Recruta%20Ind%C3%BAstria",
    );
    expect(hrefForShownContact("whatsapp", "+55 (47) 98888-7777")).toBe(
      "https://wa.me/5547988887777?text=Ol%C3%A1!%20Vi%20a%20vaga%20no%20Recruta%20Ind%C3%BAstria%20e%20quero%20me%20candidatar.",
    );
    expect(hrefForShownContact("url", "https://empresa.example/vaga")).toBe("https://empresa.example/vaga");

    const painel = describeApplyPanel({
      mode: "WHATSAPP",
      plan: "FREE",
      contact: { kind: "whatsapp", value: "5547988887777" },
      hasResume: true,
    });
    expect(JSON.stringify(painel)).not.toContain("wa.me");
  });
});
