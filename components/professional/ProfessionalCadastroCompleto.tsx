"use client";

import type { EmpresaExperiencia, FormEditPayload } from "@/lib/professional/professional-profile-map";
import { DASH, dashInnerBox } from "@/lib/dashboard-theme";
import { t } from "@/lib/i18n/translate";
import { rotuloOpcao } from "@/lib/i18n/option-label";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

const CAMPOS: Array<[string, MessageKey]> = [
  ["nome", "rest.profile.name"],
  ["email", "surface.auth.email"],
  ["dataNascimento", "rest.profile.birthDate"],
  ["idade", "rest.profile.age"],
  ["sexoBiologico", "rest.profile.sex"],
  ["identidadeGenero", "rest.profile.gender"],
  ["orientacaoSexual", "rest.profile.orientation"],
  ["estadoCivil", "rest.profile.marital"],
  ["religiao", "rest.profile.religion"],
  ["antecedentes", "rest.profile.background"],
  ["possuiFilhos", "rest.profile.children"],
  ["quantidadeFilhos", "rest.profile.childrenCount"],
  ["telefone", "registration.simple.phone"],
  ["telefone2", "rest.profile.phone2"],
  ["whatsapp", "rest.profile.whatsapp"],
  ["estado", "surface.jobs.state"],
  ["cidade", "surface.jobs.city"],
  ["disponibilidadeMudanca", "rest.profile.move"],
  ["escolaridade", "internal.resume.education"],
  ["cursoFormacao", "rest.profile.course"],
  ["instituicaoFormacao", "internal.resume.institution"],
  ["anoConclusaoFormacao", "internal.resume.year"],
  ["situacaoProfissional", "rest.profile.jobStatus"],
  ["areaInteresse", "rest.profile.interest"],
  ["cargoDesejado", "rest.profile.desiredRole"],
  ["nivelOperacional", "rest.profile.level"],
  ["areaNivel", "rest.profile.levelArea"],
  ["detalheNivel", "rest.profile.levelDetail"],
  ["turnoDisponivel", "rest.profile.shift"],
  ["disponibilidadeInicio", "rest.profile.start"],
  ["trabalhouIndustria", "rest.profile.workedIndustry"],
  ["tempoExperiencia", "rest.profile.experienceTime"],
  ["ultimoCargo", "rest.profile.lastRole"],
  ["ultimaEmpresa", "rest.profile.lastCompany"],
  ["recolocacao", "rest.profile.replacement"],
  ["pretensaoSalarial", "rest.profile.salary"],
  ["disponivelContratacao", "rest.profile.available"],
  ["possuiCNH", "rest.profile.hasLicense"],
  ["categoriaCNH", "rest.profile.licenseClass"],
  ["aceitaViagens", "rest.profile.travel"],
  ["idiomas", "rest.profile.languages"],
  ["segmentosIndustria", "rest.profile.segments"],
  ["maquinasEquipamentos", "rest.profile.machines"],
  ["qualidadeProcessos", "rest.profile.quality"],
  ["informatica", "rest.profile.it"],
  ["certificacoes", "rest.profile.certs"],
  ["mensagemEmpresas", "rest.profile.message"],
];

const DOCUMENTOS: Array<[string, MessageKey]> = [
  ["curriculo", "rest.profile.resume"],
  ["atestado", "rest.profile.medical"],
  ["certificados", "rest.profile.certificates"],
  ["cnhDocumento", "rest.profile.licenseDoc"],
];

function texto(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "boolean") return value ? t("registration.ui.sim") : t("registration.ui.nao");
  if (Array.isArray(value)) {
    return value
      .map((item) => (item && typeof item === "object" ? texto(item) : String(item ?? "")))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map((item) => texto(item)).filter(Boolean).join(" · ");
  }
  return rotuloOpcao(String(value));
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  if (!valor.trim()) return null;
  const link = /^https?:\/\//i.test(valor);
  return (
    <div style={{ padding: "8px 10px", ...dashInnerBox }}>
      <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: DASH.muted, textTransform: "uppercase" }}>{rotulo}</p>
      {link ? (
        <a href={valor} target="_blank" rel="noopener noreferrer" style={{ color: DASH.gold, fontSize: 13, fontWeight: 700 }}>
          {t("rest.profile.openFile")}
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
  const extras: Array<[MessageKey, string]> = [
    ["registration.simple.cpf", edit?.cpf || ""],
    ["registration.simple.phone", edit?.telefone || ""],
    ["rest.profile.phone2", edit?.telefone2 || ""],
    ["rest.profile.birthDate", edit?.dataNascimentoDisplay || ""],
    ["rest.profile.salary", edit?.pretensaoSalarial || ""],
    ["rest.profile.courses", (edit?.cursos || []).filter(Boolean).join(", ")],
  ];
  const empresas = edit?.empresas ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: DASH.muted, textTransform: "uppercase" }}>
        {t("rest.profile.title")}
      </p>
      {extras.map(([rotulo, valor]) => (
        <Campo key={rotulo} rotulo={t(rotulo)} valor={valor} />
      ))}
      {CAMPOS.map(([chave, rotulo]) => (
        <Campo key={chave} rotulo={t(rotulo)} valor={texto(fd[chave])} />
      ))}
      {DOCUMENTOS.map(([chave, rotulo]) => (
        <Campo key={chave} rotulo={t(rotulo)} valor={texto(fd[chave])} />
      ))}
      {empresas.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: "8px 0 0", fontSize: 10, fontWeight: 700, color: DASH.muted, textTransform: "uppercase" }}>
            {t("rest.profile.experiences")}
          </p>
          {empresas.map((empresa: EmpresaExperiencia, index) => (
            <Campo
              key={`${empresa.nome}-${empresa.cargo}-${index}`}
              rotulo={empresa.cargo || t("rest.profile.experience")}
              valor={[empresa.nome, empresa.segmento, [empresa.dataInicio, empresa.dataFim].filter(Boolean).join(" — "), empresa.descricao].filter(Boolean).join("\n")}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
