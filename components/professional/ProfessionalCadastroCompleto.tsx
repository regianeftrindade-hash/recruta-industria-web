"use client";

import type { EmpresaExperiencia, FormEditPayload } from "@/lib/professional/professional-profile-map";
import { DASH, dashInnerBox } from "@/lib/dashboard-theme";

const CAMPOS: Array<[string, string]> = [
  ["nome", "Nome"],
  ["email", "E-mail"],
  ["dataNascimento", "Data de nascimento"],
  ["idade", "Idade"],
  ["sexoBiologico", "Sexo biológico"],
  ["identidadeGenero", "Identidade de gênero"],
  ["orientacaoSexual", "Orientação sexual"],
  ["estadoCivil", "Estado civil"],
  ["religiao", "Religião"],
  ["antecedentes", "Antecedentes"],
  ["possuiFilhos", "Possui filhos"],
  ["quantidadeFilhos", "Quantidade de filhos"],
  ["telefone", "Telefone"],
  ["telefone2", "Telefone 2"],
  ["whatsapp", "WhatsApp"],
  ["estado", "Estado"],
  ["cidade", "Cidade"],
  ["disponibilidadeMudanca", "Disponibilidade de mudança"],
  ["escolaridade", "Escolaridade"],
  ["cursoFormacao", "Curso de formação"],
  ["instituicaoFormacao", "Instituição"],
  ["anoConclusaoFormacao", "Ano de conclusão"],
  ["situacaoProfissional", "Situação profissional"],
  ["areaInteresse", "Área de interesse"],
  ["cargoDesejado", "Cargo desejado"],
  ["nivelOperacional", "Nível operacional"],
  ["areaNivel", "Área do nível"],
  ["detalheNivel", "Detalhe do nível"],
  ["turnoDisponivel", "Turno disponível"],
  ["disponibilidadeInicio", "Disponibilidade para início"],
  ["trabalhouIndustria", "Trabalhou na indústria"],
  ["tempoExperiencia", "Tempo de experiência"],
  ["ultimoCargo", "Último cargo"],
  ["ultimaEmpresa", "Última empresa"],
  ["recolocacao", "Recolocação"],
  ["pretensaoSalarial", "Pretensão salarial"],
  ["disponivelContratacao", "Disponível para contratação"],
  ["possuiCNH", "Possui CNH"],
  ["categoriaCNH", "Categoria da CNH"],
  ["aceitaViagens", "Aceita viagens"],
  ["idiomas", "Idiomas"],
  ["segmentosIndustria", "Segmentos da indústria"],
  ["maquinasEquipamentos", "Máquinas e equipamentos"],
  ["qualidadeProcessos", "Qualidade e processos"],
  ["informatica", "Informática"],
  ["certificacoes", "Certificações"],
  ["mensagemEmpresas", "Mensagem para empresas"],
];

const DOCUMENTOS: Array<[string, string]> = [
  ["curriculo", "Currículo"],
  ["atestado", "Atestado"],
  ["certificados", "Certificados"],
  ["cnhDocumento", "Documento da CNH"],
];

function texto(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) {
    return value
      .map((item) => (item && typeof item === "object" ? texto(item) : String(item ?? "")))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map((item) => texto(item)).filter(Boolean).join(" · ");
  }
  return String(value);
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  if (!valor.trim()) return null;
  const link = /^https?:\/\//i.test(valor);
  return (
    <div style={{ padding: "8px 10px", ...dashInnerBox }}>
      <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: DASH.muted, textTransform: "uppercase" }}>{rotulo}</p>
      {link ? (
        <a href={valor} target="_blank" rel="noopener noreferrer" style={{ color: DASH.gold, fontSize: 13, fontWeight: 700 }}>
          Abrir arquivo
        </a>
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: DASH.text, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{valor}</p>
      )}
    </div>
  );
}

export default function ProfessionalCadastroCompleto({
  edit,
}: {
  edit: FormEditPayload | null;
}) {
  const fd = edit?.formData ?? {};
  const extras: Array<[string, string]> = [
    ["CPF", edit?.cpf || ""],
    ["Telefone", edit?.telefone || ""],
    ["Telefone 2", edit?.telefone2 || ""],
    ["Data de nascimento", edit?.dataNascimentoDisplay || ""],
    ["Pretensão salarial", edit?.pretensaoSalarial || ""],
    ["Cursos", (edit?.cursos || []).filter(Boolean).join(", ")],
  ];
  const empresas = edit?.empresas ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: DASH.muted, textTransform: "uppercase" }}>
        Cadastro completo
      </p>
      {extras.map(([rotulo, valor]) => (
        <Campo key={rotulo} rotulo={rotulo} valor={valor} />
      ))}
      {CAMPOS.map(([chave, rotulo]) => (
        <Campo key={chave} rotulo={rotulo} valor={texto(fd[chave])} />
      ))}
      {DOCUMENTOS.map(([chave, rotulo]) => (
        <Campo key={chave} rotulo={rotulo} valor={texto(fd[chave])} />
      ))}
      {empresas.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: "8px 0 0", fontSize: 10, fontWeight: 700, color: DASH.muted, textTransform: "uppercase" }}>
            Experiências
          </p>
          {empresas.map((empresa: EmpresaExperiencia, index) => (
            <Campo
              key={`${empresa.nome}-${empresa.cargo}-${index}`}
              rotulo={empresa.cargo || "Experiência"}
              valor={[empresa.nome, empresa.segmento, [empresa.dataInicio, empresa.dataFim].filter(Boolean).join(" — "), empresa.descricao].filter(Boolean).join("\n")}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
