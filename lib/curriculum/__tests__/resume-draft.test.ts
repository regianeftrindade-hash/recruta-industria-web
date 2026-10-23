import { describe, expect, it } from "vitest";
import { PREMIUM_HIRE_NOTICE, PREMIUM_RESUME_PROMPT } from "@/lib/curriculum/resume-copy";
import {
  RESUME_FOOTER,
  RESUME_MODELS,
  inspectResumeLayout,
  normalizeResumeModel,
  renderResumePdf,
  resumeBlocks,
  resumeTextWidth,
  sanitizeResumeDraft,
  type ResumeDraft,
  type ResumeModelId,
} from "@/lib/curriculum/resume-draft";
import { draftFromProfile } from "@/lib/curriculum/resume-from-profile";

function pdfText(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("latin1");
}

function joined(draft: ResumeDraft, model: ResumeModelId, role?: "name" | "body" | "title" | "contact" | "footer") {
  return inspectResumeLayout(draft, model).lines
    .filter((line) => (role ? line.role === role : line.role !== "footer"))
    .map((line) => line.text)
    .join(" ");
}

describe("gerador de currículo", () => {
  it("omite seções vazias e não inventa experiência", () => {
    const blocks = resumeBlocks(sanitizeResumeDraft({
      nome: "Ana Souza",
      cidade: "Joinville",
      estado: "SC",
      objetivo: "Operadora de produção",
    }));
    const titles = blocks.blocks.map((block) => block.title);
    expect(blocks.heading[0]).toBe("Ana Souza");
    expect(titles).toContain("Objetivo");
    expect(titles).not.toContain("Experiência profissional");
    expect(titles).not.toContain("Idiomas");
    expect(JSON.stringify(blocks)).not.toMatch(/empresa fictícia|lorem|exemplo de cargo/i);
  });

  it("lê só os dados reais do perfil e deixa de fora CPF, religião e antecedentes", () => {
    const draft = draftFromProfile({
      name: "Ana Souza",
      email: "ana@example.invalid",
      profile: {
        cidade: "Joinville",
        estado: "SC",
        phone: "47999998888",
        email: "ana@example.invalid",
        cargoDesejado: "Soldadora",
        mensagemEmpresas: "Atuo em linha de produção.",
        escolaridade: "Técnico",
        experienciasJSON: JSON.stringify([
          { nome: "Metalúrgica Sul", cargo: "Soldadora", dataInicio: "2020", dataFim: "2024", descricao: "Solda MIG" },
        ]),
        cursosCertificacoes: JSON.stringify(["NR-12"]),
        skills: JSON.stringify(["Solda MIG", "Inglês"]),
        formDataJSON: JSON.stringify({
          cpf: "123.456.789-00",
          religiao: "Católica",
          antecedentes: "Não",
          possuiCNH: "Sim",
          categoriaCNH: "B",
          idiomas: ["Inglês"],
          cursoFormacao: "Técnico em mecânica",
          instituicaoFormacao: "SENAI",
        }),
      },
    });

    expect(draft.nome).toBe("Ana Souza");
    expect(draft.experiencias[0]?.empresa).toBe("Metalúrgica Sul");
    expect(draft.cnh).toBe("B");
    expect(draft.idiomas).toEqual(["Inglês"]);
    expect(draft.habilidades).toEqual(["Solda MIG"]);
    expect(JSON.stringify(draft)).not.toContain("123.456.789-00");
    expect(JSON.stringify(draft)).not.toContain("Católica");
    expect(JSON.stringify(draft)).not.toContain("antecedentes");
  });

  it("gera um PDF de texto, com acento, e abre outra página quando o conteúdo passa de uma", () => {
    const curto = renderResumePdf(sanitizeResumeDraft({
      nome: "Ana Souza",
      cidade: "São Paulo",
      estado: "SP",
      resumo: "Produção industrial.",
      experiencias: [{ empresa: "A (B)", cargo: "Operadora", inicio: "2021", fim: "", atividades: "Linha", segmento: "" }],
    }));
    const texto = Buffer.from(curto).toString("latin1");
    expect(texto.startsWith("%PDF-1.4")).toBe(true);
    expect(texto).toContain("Ana Souza");
    expect(texto).toContain("São Paulo");
    expect(texto).toContain("Produção industrial.");
    expect(texto).toContain("A \\(B\\)");
    expect(texto).not.toContain("Experiência fictícia");

    const longoDraft = sanitizeResumeDraft({
      nome: "Ana Souza",
      experiencias: Array.from({ length: 12 }, (_, index) => ({
        empresa: `Empresa ${index + 1}`,
        cargo: "Operadora de produção",
        inicio: "2010",
        fim: "2020",
        atividades: "Atividade detalhada na linha industrial. ".repeat(30),
        segmento: "Metalurgia",
      })),
    });
    const longo = renderResumePdf(longoDraft);
    const paginas = inspectResumeLayout(longoDraft).pageCount;
    expect(paginas).toBeGreaterThanOrEqual(2);
    expect(pdfText(longo)).toContain(`/Count ${paginas}`);
  });

  it("usa o modelo clássico por padrão e oferece os três modelos", () => {
    expect(normalizeResumeModel(undefined)).toBe("classico");
    expect(normalizeResumeModel("outro")).toBe("classico");
    expect(RESUME_MODELS.map((item) => item.label)).toEqual([
      "Profissional clássico",
      "Moderno discreto",
      "Compacto",
    ]);
    const draft = sanitizeResumeDraft({ nome: "Ana Souza", cidade: "Curitiba" });
    const classico = pdfText(renderResumePdf(draft));
    expect(classico).toContain("/F2 18 Tf");
    expect(classico).not.toContain("0.72 G");
    expect(pdfText(renderResumePdf(draft, "moderno"))).toContain("0.72 G");
    expect(pdfText(renderResumePdf(draft, "compacto"))).toContain("/F2 15 Tf");
  });

  it("repete o rodapé discreto em todas as páginas, sem invadir o texto", () => {
    const draft = sanitizeResumeDraft({
      nome: "José Antônio Conceição",
      cidade: "São Paulo",
      estado: "SP",
      objetivo: "Coordenação de manutenção industrial",
      resumo: "Atuo com produção, qualidade e qualificação de equipes.",
      experiencias: Array.from({ length: 8 }, (_, index) => ({
        empresa: `Metalúrgica ${index + 1}`,
        cargo: "Coordenador de manutenção e soldagem especializada",
        inicio: String(2024 - index),
        fim: index === 0 ? "" : String(2025 - index),
        atividades: "Descrição da manutenção diária na linha de produção, com acompanhamento de qualidade. ".repeat(12),
        segmento: "Metalurgia",
      })),
      cursos: Array.from({ length: 12 }, (_, index) => `Curso de qualificação ${index + 1}`),
      habilidades: ["Solda MIG", "Leitura de desenho"],
    });

    for (const model of ["classico", "moderno", "compacto"] as const) {
      const layout = inspectResumeLayout(draft, model);
      const pdf = pdfText(renderResumePdf(draft, model));
      expect(pdf).toContain("595.28");
      expect(pdf).toContain("841.89");
      expect(pdf).toContain("0.45 g");
      expect(pdf).toContain("/F1 8 Tf");
      expect(pdf.match(/Currículo gerado pelo site Recruta Indústria/g)?.length).toBe(layout.pageCount);
      expect(layout.pageCount).toBeGreaterThanOrEqual(2);

      const footers = layout.lines.filter((line) => line.role === "footer");
      expect(footers).toHaveLength(layout.pageCount);
      const footerX = (595.28 - resumeTextWidth(RESUME_FOOTER, 8)) / 2;
      for (let page = 0; page < layout.pageCount; page += 1) {
        const pageFooters = footers.filter((line) => line.page === page);
        expect(pageFooters).toHaveLength(1);
        expect(pageFooters[0]?.text).toBe(RESUME_FOOTER);
        expect(pageFooters[0]?.y).toBe(28);
        expect(pageFooters[0]?.size).toBe(8);
        expect(pageFooters[0]?.x).toBeCloseTo(footerX, 5);
      }

      const content = layout.lines.filter((line) => line.role !== "footer");
      expect(content.length).toBeGreaterThan(0);
      for (const line of content) {
        expect(line.y).toBeGreaterThanOrEqual(layout.contentFloor);
        expect(line.y - 28).toBeGreaterThanOrEqual(16);
      }
      for (let index = 0; index < content.length; index += 1) {
        const line = content[index];
        const next = content[index + 1];
        if (line?.role === "title" && next) expect(next.page).toBe(line.page);
      }

      expect(joined(draft, model)).toContain("José Antônio Conceição");
      expect(joined(draft, model)).toContain("São Paulo");
      expect(joined(draft, model)).toContain("qualificação");
      expect(joined(draft, model, "name")?.split(" ")[0]).toBe("José");
    }
  });

  it("ordena experiências da mais recente para a mais antiga e não corta texto longo", () => {
    const cargo = `Coordenador ${"de manutenção industrial ".repeat(6)}`.trim();
    const token = "X".repeat(160);
    const atividades = "Descrição longa da manutenção diária na linha de produção. ".repeat(40);
    const draft = sanitizeResumeDraft({
      nome: "Maria Aparecida dos Santos Oliveira e Conceição",
      experiencias: [
        { empresa: "Antiga", cargo: "Auxiliar", inicio: "2010", fim: "2012", atividades: "Primeira fase", segmento: "" },
        { empresa: "Recente", cargo: "Líder", inicio: "03/2022", fim: "", atividades: "Trabalho atual", segmento: "" },
        { empresa: "Meio", cargo: "Operadora", inicio: "2015", fim: "2018", atividades: "Fase intermediária", segmento: "" },
        { empresa: "Sem data", cargo: token, inicio: "", fim: "", atividades: "Atividade avulsa", segmento: "" },
      ],
      cursos: Array.from({ length: 18 }, (_, index) => `NR-${index + 1} atualizada`),
    });
    const experience = resumeBlocks(draft).blocks.find((block) => block.title === "Experiência profissional");
    const text = experience?.lines.join("\n") || "";
    expect(text.indexOf("Recente")).toBeLessThan(text.indexOf("Meio"));
    expect(text.indexOf("Meio")).toBeLessThan(text.indexOf("Antiga"));
    expect(text.indexOf("Antiga")).toBeLessThan(text.indexOf("Sem data"));
    expect(text).toContain(token);

    const layout = inspectResumeLayout(draft, "compacto");
    const body = layout.lines.filter((line) => line.role !== "footer").map((line) => line.text).join("");
    expect(body).toContain(token);
    expect(layout.lines.find((line) => line.role === "name")?.size).toBe(15);
    expect(layout.lines.find((line) => line.role === "body")?.size).toBe(10.5);
    expect(joined(draft, "classico")).toContain("Maria Aparecida dos Santos Oliveira e Conceição");

    const longo = sanitizeResumeDraft({
      nome: "Ana Souza",
      experiencias: [{ empresa: "Linha", cargo: cargo, inicio: "2020", fim: "2024", atividades, segmento: "Usinagem" }],
    });
    const words = atividades.trim().split(/\s+/);
    const rendered = joined(longo, "classico");
    let cursor = 0;
    for (const word of words) {
      const at = rendered.indexOf(word, cursor);
      expect(at).toBeGreaterThanOrEqual(0);
      cursor = at + word.length;
    }
    expect(rendered).toContain(cargo);
    const shortName = inspectResumeLayout(sanitizeResumeDraft({ nome: "Ana" }), "classico");
    const longName = inspectResumeLayout(longo, "classico");
    expect(shortName.lines.find((line) => line.role === "name")?.size).toBe(18);
    expect(longName.lines.find((line) => line.role === "name")?.size).toBe(18);
    expect(longName.lines.find((line) => line.role === "body")?.size).toBe(11);
  });

  it("mantém uma página só com o rodapé quando não há dados profissionais", () => {
    const vazio = sanitizeResumeDraft({});
    const layout = inspectResumeLayout(vazio);
    expect(layout.pageCount).toBe(1);
    expect(layout.lines.map((line) => line.role)).toEqual(["footer"]);
    const pdf = pdfText(renderResumePdf(vazio));
    expect(pdf).toContain(RESUME_FOOTER);
    expect(pdf).not.toContain("Experiência profissional");
  });

  it("descarta e-mail inválido e não guarda o caminho de outro profissional", () => {
    const draft = sanitizeResumeDraft({
      nome: "Ana",
      email: "nao-e-email",
      experiencias: [{ empresa: "", cargo: "", atividades: "" }],
    });
    expect(draft.email).toBe("");
    expect(draft.experiencias).toEqual([]);
  });

  it("mantém o texto do aviso de contratação e o pedido de currículo do Premium", () => {
    expect(PREMIUM_RESUME_PROMPT).toBe(
      "Para utilizar a candidatura Premium, você precisa ter um currículo salvo no seu perfil.",
    );
    expect(PREMIUM_HIRE_NOTICE).toHaveLength(4);
    expect(PREMIUM_HIRE_NOTICE[0]).toMatch(/Mantenha seu currículo disponível/);
    expect(PREMIUM_HIRE_NOTICE.join(" ")).toMatch(/continuar|depois/i);
  });
});
