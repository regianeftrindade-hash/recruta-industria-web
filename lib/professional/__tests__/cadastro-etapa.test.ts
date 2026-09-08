import { describe, expect, it } from "vitest";
import {
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
    empresas: [{ nome: "", cargo: "" }],
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

  it("etapa essenciais exige nome/cpf/contato", () => {
    const faltando = validarCamposObrigatoriosEtapa(base(), 0);
    expect(faltando.some((c) => c.id === "nome")).toBe(true);
    expect(faltando.some((c) => c.id === "email")).toBe(true);
    expect(faltando.some((c) => c.id === "escolaridade")).toBe(false);
  });

  it("etapa finalizar só cobra termos", () => {
    const faltando = validarCamposObrigatoriosEtapa(
      base({
        nome: "Ana",
        cpf: "529.982.247-25",
        autorizoDados: false,
      }),
      3,
    );
    expect(faltando.every((c) => ["autorizoDados", "declaroVerdadeiro", "aceitoLGPD"].includes(c.id))).toBe(
      true,
    );
  });
});
