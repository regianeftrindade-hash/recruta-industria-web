import { isValidEmail } from '@/lib/security';

export type CampoObrigatorioId =
  | 'nome'
  | 'cpf'
  | 'dataNascimento'
  | 'sexoBiologico'
  | 'estadoCivil'
  | 'possuiCNH'
  | 'categoriaCNH'
  | 'antecedentes'
  | 'email'
  | 'telefone'
  | 'whatsapp'
  | 'estado'
  | 'cidade'
  | 'disponibilidadeMudanca'
  | 'aceitaViagens'
  | 'escolaridade'
  | 'cursoFormacao'
  | 'anoConclusaoFormacao'
  | 'situacaoProfissional'
  | 'areaInteresse'
  | 'nivelOperacional'
  | 'cargoDesejado'
  | 'areaNivel'
  | 'turnoDisponivel'
  | 'disponibilidadeInicio'
  | 'pretensaoSalarial'
  | 'trabalhouIndustria'
  | 'experiencias'
  | 'autorizoDados'
  | 'declaroVerdadeiro'
  | 'aceitoLGPD'
  | 'password'
  | 'confirmPassword';

export type CampoObrigatorioFalta = {
  id: CampoObrigatorioId;
  label: string;
};

export type ValidacaoCadastroInput = {
  nome: string;
  cpf: string;
  cpfError: string;
  dataNascimentoValue: string;
  dataNascimento: string;
  sexoBiologico: string;
  estadoCivil: string;
  possuiCNH: string;
  categoriaCNH: string;
  antecedentes: string;
  email: string;
  telefone: string;
  telefone2: string;
  whatsapp: string;
  estado: string;
  cidade: string;
  disponibilidadeMudanca: string;
  aceitaViagens: string;
  escolaridade: string;
  cursoFormacao: string;
  anoConclusaoFormacao: string;
  situacaoProfissional: string;
  areaInteresse: string;
  nivelOperacional: string;
  cargoDesejado: string;
  areaNivel: string;
  detalheNivel: string;
  turnoDisponivel: string;
  disponibilidadeInicio: string;
  pretensaoSalarial: string;
  trabalhouIndustria: string;
  empresas: Array<{ nome: string; cargo: string }>;
  autorizoDados: boolean;
  declaroVerdadeiro: boolean;
  aceitoLGPD: boolean;
  exigeSenha: boolean;
  password: string;
  confirmPassword: string;
};

function campoVazio(valor: string | null | undefined): boolean {
  return !valor || !String(valor).trim();
}

function dataNascimentoValida(dataDisplay: string, dataIso: string): boolean {
  if (dataDisplay.trim().length === 10) return true;
  return !campoVazio(dataIso);
}

export function validarCamposObrigatoriosCadastro(input: ValidacaoCadastroInput): CampoObrigatorioFalta[] {
  const faltando: CampoObrigatorioFalta[] = [];

  const add = (id: CampoObrigatorioId, label: string) => {
    if (!faltando.some((item) => item.id === id && item.label === label)) {
      faltando.push({ id, label });
    }
  };

  if (campoVazio(input.nome)) add('nome', 'Nome completo');
  if (campoVazio(input.cpf) || input.cpf.replace(/\D/g, '').length < 11) {
    add('cpf', 'CPF');
  } else if (input.cpfError) {
    add('cpf', 'CPF válido');
  }
  if (!dataNascimentoValida(input.dataNascimentoValue, input.dataNascimento)) {
    add('dataNascimento', 'Nascimento');
  }
  if (campoVazio(input.sexoBiologico)) add('sexoBiologico', 'Sexo biológico');
  if (campoVazio(input.estadoCivil)) add('estadoCivil', 'Estado civil');
  if (campoVazio(input.possuiCNH)) add('possuiCNH', 'Possui CNH?');
  if (input.possuiCNH === 'Sim' && campoVazio(input.categoriaCNH)) {
    add('categoriaCNH', 'Categoria da CNH');
  }
  if (campoVazio(input.antecedentes)) add('antecedentes', 'Antecedentes criminais');

  if (campoVazio(input.email)) add('email', 'E-mail');
  else if (!isValidEmail(input.email)) add('email', 'E-mail válido');
  const telPrincipal = input.telefone.replace(/\D/g, '');
  const telAlternativo = input.telefone2.replace(/\D/g, '');
  if (telPrincipal.length < 10 && telAlternativo.length < 10) {
    add('telefone', 'Telefone / WhatsApp (DDD)');
  }
  if (campoVazio(input.whatsapp)) add('whatsapp', 'Este número é WhatsApp?');

  if (campoVazio(input.estado)) add('estado', 'Estado (UF)');
  if (campoVazio(input.cidade)) add('cidade', 'Cidade');
  if (campoVazio(input.disponibilidadeMudanca)) add('disponibilidadeMudanca', 'Disponibilidade para mudança');
  if (campoVazio(input.aceitaViagens)) add('aceitaViagens', 'Disponibilidade para viagens');

  if (campoVazio(input.escolaridade)) add('escolaridade', 'Escolaridade (nível)');
  if (campoVazio(input.cursoFormacao)) add('cursoFormacao', 'Curso');
  if (campoVazio(input.anoConclusaoFormacao)) add('anoConclusaoFormacao', 'Ano de conclusão');

  if (campoVazio(input.situacaoProfissional)) add('situacaoProfissional', 'Situação profissional atual');
  if (campoVazio(input.areaInteresse)) add('areaInteresse', 'Área de interesse');
  if (campoVazio(input.nivelOperacional)) add('nivelOperacional', 'Nível operacional');
  if (campoVazio(input.cargoDesejado)) add('cargoDesejado', 'Cargo desejado');
  if (!campoVazio(input.nivelOperacional) && campoVazio(input.areaNivel)) {
    add('areaNivel', 'Área Operacional');
  }
  if (campoVazio(input.turnoDisponivel)) add('turnoDisponivel', 'Turno disponível');
  if (campoVazio(input.disponibilidadeInicio)) add('disponibilidadeInicio', 'Disponibilidade para início');
  if (campoVazio(input.pretensaoSalarial)) add('pretensaoSalarial', 'Pretensão salarial');

  if (campoVazio(input.trabalhouIndustria)) add('trabalhouIndustria', 'Trabalhou na indústria?');
  if (input.trabalhouIndustria === 'Sim') {
    const temExperiencia = input.empresas.some(
      (e) => !campoVazio(e.nome) && !campoVazio(e.cargo),
    );
    if (!temExperiencia) add('experiencias', 'Pelo menos 1 experiência profissional');
  }

  if (!input.autorizoDados) add('autorizoDados', 'Termo de Autorização de Uso de Dados');
  if (!input.declaroVerdadeiro) add('declaroVerdadeiro', 'Termo de Declaração de Veracidade');
  if (!input.aceitoLGPD) add('aceitoLGPD', 'Termo LGPD');

  if (input.exigeSenha) {
    if (!input.password || input.password.length < 8) add('password', 'Senha (mínimo 8 caracteres)');
    if (!input.confirmPassword) add('confirmPassword', 'Confirmar senha');
    if (
      input.password
      && input.confirmPassword
      && input.password !== input.confirmPassword
    ) {
      add('password', 'Senha e confirmação iguais');
      add('confirmPassword', 'Senha e confirmação iguais');
    }
  }

  return faltando;
}
