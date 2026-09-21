import { describe, expect, it } from "vitest";
import {
  validarCamposObrigatoriosCadastro,
  validarCamposObrigatoriosEtapa,
  type ValidacaoCadastroInput,
} from "@/lib/professional/cadastro-obrigatorios";

function base(over: Partial<ValidacaoCadastroInput> = {}): ValidacaoCadastroInput {
  return {
    nome: "",
    cpf: "",
    cpfError: "",
    dataNascimentoValue: "",
    dataNascimento: "",
    sexoBiologico: "",
    estadoCivil: "",
    possuiCNH: "",
    categoriaCNH: "",
    antecedentes: "",
    email: "",
    telefone: "",
    telefone2: "",
    whatsapp: "",
    estado: "",
    cidade: "",
    disponibilidadeMudanca: "",
    aceitaViagens: "",
    escolaridade: "",
    cursoFormacao: "",
    anoConclusaoFormacao: "",
    situacaoProfissional: "",
    areaInteresse: "",
    nivelOperacional: "",
    cargoDesejado: "",
    areaNivel: "",
    detalheNivel: "",
    turnoDisponivel: "",
    disponibilidadeInicio: "",
    pretensaoSalarial: "",
    trabalhouIndustria: "",
    empresas: [{ nome: "", cargo: "", dataInicio: "", dataFim: "" }],
    autorizoDados: false,
    declaroVerdadeiro: false,
    aceitoLGPD: false,
    exigeSenha: true,
    password: "",
    confirmPassword: "",
    ...over,
  };
}

describe("validarCamposObrigatoriosEtapa", () => {
  it("etapa diferenciais (2) não exige campos", () => {
    expect(validarCamposObrigatoriosEtapa(base(), 2)).toEqual([]);
  });

  it("etapa essenciais exige nome/nascimento/contato/local", () => {
    const faltando = validarCamposObrigatoriosEtapa(base(), 0);
    expect(faltando.some((c) => c.id === "nome")).toBe(true);
    expect(faltando.some((c) => c.id === "dataNascimento")).toBe(true);
    expect(faltando.some((c) => c.id === "email")).toBe(true);
    expect(faltando.some((c) => c.id === "estado")).toBe(true);
    expect(faltando.some((c) => c.id === "cidade")).toBe(true);
    expect(faltando.some((c) => c.id === "cpf")).toBe(false);
    expect(faltando.some((c) => c.id === "escolaridade")).toBe(false);
  });

  it("etapa carreira exige escolaridade, cargo, pretensão e experiências", () => {
    const faltando = validarCamposObrigatoriosEtapa(base(), 1);
    expect(faltando.some((c) => c.id === "escolaridade")).toBe(true);
    expect(faltando.some((c) => c.id === "cargoDesejado")).toBe(true);
    expect(faltando.some((c) => c.id === "pretensaoSalarial")).toBe(true);
    expect(faltando.some((c) => c.id === "experiencias")).toBe(true);
    expect(faltando.some((c) => c.id === "areaInteresse")).toBe(false);
  });

  it("etapa finalizar só cobra termos", () => {
    const faltando = validarCamposObrigatoriosEtapa(
      base({
        nome: "Ana",
        autorizoDados: false,
      }),
      3,
    );
    expect(faltando.every((c) => ["autorizoDados", "declaroVerdadeiro", "aceitoLGPD"].includes(c.id))).toBe(
      true,
    );
  });
});

describe("validarCamposObrigatoriosCadastro", () => {
  it("aceita perfil mínimo completo", () => {
    const faltando = validarCamposObrigatoriosCadastro(
      base({
        nome: "João Silva",
        dataNascimentoValue: "15/03/1990",
        dataNascimento: "1990-03-15",
        email: "joao@email.com",
        telefone: "(41) 99999-8877",
        whatsapp: "Sim",
        estado: "PR",
        cidade: "Curitiba",
        escolaridade: "Médio completo",
        situacaoProfissional: "Empregado",
        cargoDesejado: "Operador CNC",
        pretensaoSalarial: "3500",
        empresas: [{ nome: "Metalúrgica X", cargo: "Operador", dataInicio: "2020-01", dataFim: "" }],
        autorizoDados: true,
        declaroVerdadeiro: true,
        aceitoLGPD: true,
        exigeSenha: false,
      }),
    );
    expect(faltando).toEqual([]);
  });

  it("não exige CNH nem área de interesse", () => {
    const faltando = validarCamposObrigatoriosCadastro(base({ exigeSenha: false }));
    const ids = faltando.map((c) => c.id);
    expect(ids).toContain("dataNascimento");
    expect(ids).not.toContain("possuiCNH");
    expect(ids).not.toContain("areaInteresse");
    expect(ids).not.toContain("cursoFormacao");
  });
});
