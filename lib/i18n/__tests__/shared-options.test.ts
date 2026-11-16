import { describe, expect, it } from "vitest";
import { messagesPtBR } from "@/lib/i18n/messages/pt-BR";
import { rotuloOpcao } from "@/lib/i18n/option-label";
import { t } from "@/lib/i18n/translate";
import {
  AREAS_COMPLEMENTO_NIVEL,
  AREAS_CURSO,
  CURSOS_INDUSTRIAIS_SUGERIDOS,
  ESCOLARIDADES_OPCOES,
  IDIOMAS_OPCOES,
  INFORMATICA_OPCOES,
  MAQUINAS_EQUIPAMENTOS,
  NIVEIS_OPERACIONAIS,
  PREFIRO_NAO_INFORMAR,
  QUALIDADE_PROCESSOS,
  SEGMENTOS_INDUSTRIA,
  buildCargoDesejado,
  parseIdiomaEntry,
  serializeIdioma,
} from "@/lib/professional/professional-form-config";
import { SOBRE_MIM_CAMPOS, serializeSobreMim } from "@/lib/profile/sobre-mim";
import { sanitizeResumeProfileFields } from "@/lib/curriculum/sanitize-resume-fields";

const listas = [
  MAQUINAS_EQUIPAMENTOS,
  QUALIDADE_PROCESSOS,
  INFORMATICA_OPCOES,
  SEGMENTOS_INDUSTRIA,
  CURSOS_INDUSTRIAIS_SUGERIDOS,
  AREAS_CURSO,
  ESCOLARIDADES_OPCOES,
  IDIOMAS_OPCOES,
  NIVEIS_OPERACIONAIS,
  AREAS_COMPLEMENTO_NIVEL,
];

describe("listas compartilhadas", () => {
  it("exibe o mesmo português e preserva o valor gravado", () => {
    expect(PREFIRO_NAO_INFORMAR).toBe("Prefiro não informar");
    expect(rotuloOpcao(PREFIRO_NAO_INFORMAR)).toBe(PREFIRO_NAO_INFORMAR);
    expect(t("option.prefiro-nao-informar", "en-US")).toBe("Prefer not to say");

    for (const lista of listas) {
      for (const valor of lista) {
        expect(rotuloOpcao(valor)).toBe(valor);
        expect(valor.startsWith("option.")).toBe(false);
      }
    }

    expect(rotuloOpcao("curso livre informado pelo candidato")).toBe(
      "curso livre informado pelo candidato",
    );
  });

  it("grava idioma, cargo e currículo com o texto interno", () => {
    expect(serializeIdioma({ selecionado: "Inglês" })).toBe("Inglês");
    expect(serializeIdioma({ selecionado: "Outros", custom: "Latim" })).toBe("Outros: Latim");
    expect(parseIdiomaEntry("Inglês").selecionado).toBe("Inglês");
    expect(buildCargoDesejado({ nivelOperacional: "Operador", areaNivel: "Produção" })).toBe(
      "Operador — de Produção",
    );

    const limpo = sanitizeResumeProfileFields({
      nome: "Ana",
      cursoFormacao: "",
      instituicaoFormacao: "",
      cursos: [],
      certificacoes: [],
      maquinasEquipamentos: ["CNC", "Excel Básico"],
      qualidadeProcessos: ["5S"],
      informatica: [],
    });
    expect(limpo.maquinasEquipamentos).toEqual(["CNC"]);
    expect(limpo.informatica).toEqual(["Excel Básico"]);
    expect(limpo.qualidadeProcessos).toEqual(["5S"]);
  });

  it("mantém as chaves de preferências pessoais e só traduz o rótulo", () => {
    const campos = SOBRE_MIM_CAMPOS.map((campo) => campo.key);
    expect(campos).toEqual([
      "hobbys",
      "estiloMusical",
      "livros",
      "filmesSeries",
      "fraseQueDefine",
      "assuntosInteresse",
    ]);
    for (const campo of SOBRE_MIM_CAMPOS) {
      expect(rotuloOpcao(campo.label)).toBe(campo.label);
      expect(rotuloOpcao(campo.placeholder)).toBe(campo.placeholder);
    }
    const salvo = JSON.parse(serializeSobreMim({
      hobbys: "corrida",
      estiloMusical: "MPB",
      livros: "",
      filmesSeries: "",
      fraseQueDefine: "",
      assuntosInteresse: "",
    })) as Record<string, string>;
    expect(salvo.hobbys).toBe("corrida");
    expect(salvo.estiloMusical).toBe("MPB");
    expect(Object.keys(salvo)).not.toContain("Hobbies");
  });

  it("não cria outro idioma no catálogo", () => {
    expect(Object.keys(messagesPtBR).length).toBeGreaterThan(502);
    expect(JSON.stringify(messagesPtBR)).not.toMatch(/"[a-z]{2}-[A-Z]{2}"\s*:/);
  });
});
