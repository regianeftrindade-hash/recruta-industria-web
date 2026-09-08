"use client";

import React from "react";
import type { FormEditPayload } from "@/lib/professional-profile-map";
import {
  parseCursosDetalhados,
  parseCertificacoesDetalhadas,
  type CursoDetalhado,
} from "@/lib/professional-form-config";
import { isArquivoAnexado, nomeArquivoAnexado } from "@/lib/arquivo-anexo";
import type { SobreMimData } from "@/lib/sobre-mim";
import { PERFIL_INFO, type ResultadoTesteComportamental } from "@/lib/teste-comportamental";
import {
  DASH,
  dashCard,
  dashInnerBox,
} from "@/lib/dashboard-theme";
import CarreiraTimeline from "@/components/professional/CarreiraTimeline";
import {
  CAMPOS_SOBRE_MIM,
  CardSecaoPerfil,
  PerfilTextoCorrido,
  goldTitle,
  labelStyle,
  listaDeStrings,
  valueStyle,
} from "@/components/company/candidate-profile-bits";
import { buildCareerTimeline } from "@/lib/professional/career-timeline";
import { formatReaisDisplay, turnoPropostaLabel } from "@/lib/format-reais";
import type {
  DocumentoAnexo,
  Resumo,
} from "@/components/company/company-candidate-profile-types";

type Props = {
  resumo: Resumo;
  formEdit: FormEditPayload | null;
  sobreMim: SobreMimData | null;
  sobreMimPreenchido: boolean;
  testeComportamental: ResultadoTesteComportamental | null;
  documentos: DocumentoAnexo[];
};

export default function CompanyCandidateProfileDetails({
  resumo,
  formEdit,
  sobreMim,
  sobreMimPreenchido,
  testeComportamental,
  documentos,
}: Props) {
  const fd = formEdit?.formData ?? {};
  const valor = (chave: string, alt?: unknown): string => {
    const v = fd[chave];
    if (v !== undefined && v !== null && v !== "") {
      return typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? String(v) : "—";
    }
    if (alt !== undefined && alt !== null && alt !== "") {
      return typeof alt === "string" || typeof alt === "number" || typeof alt === "boolean" ? String(alt) : "—";
    }
    return "—";
  };
  const cursosDetalhados: CursoDetalhado[] =
    formEdit?.cursosDetalhados && formEdit.cursosDetalhados.length > 0
      ? formEdit.cursosDetalhados
      : parseCursosDetalhados(fd.cursosDetalhados ?? formEdit?.cursos ?? fd.cursosCertificacoes);
  const cursos = cursosDetalhados.length > 0
    ? cursosDetalhados.map((c) => c.nome)
    : (formEdit?.cursos?.filter(Boolean) ?? listaDeStrings(fd.cursosCertificacoes));
  const certificacoesDetalhadas = parseCertificacoesDetalhadas(fd.certificacoesDetalhadas ?? fd.certificacoes);
  const empresas = formEdit?.empresas?.filter((e) => e.nome?.trim() || e.cargo?.trim()) ?? [];
  const carreiraTimeline = buildCareerTimeline(empresas);

  return (
    <>
      {!resumo.bloqueado && formEdit ? (
        <CardSecaoPerfil
          emoji="📞"
          titulo="Contato"
          pares={[
            { label: "E-mail", value: valor("email") !== "—" ? valor("email") : undefined },
            { label: "Telefone", value: formEdit.telefone || fd.telefone },
            { label: "Telefone 2", value: formEdit.telefone2 || fd.telefone2 },
            { label: "WhatsApp", value: fd.whatsapp },
          ]}
        />
      ) : null}

      {!resumo.bloqueado && formEdit ? (
        <>
          <CardSecaoPerfil
            emoji="🏭"
            titulo="Dados pessoais"
            pares={[
              { label: "Nome", value: valor("nome") !== "—" ? valor("nome") : resumo.nome },
              { label: "CPF", value: formEdit.cpf || fd.cpf },
              { label: "Nascimento", value: formEdit.dataNascimentoDisplay || fd.dataNascimento },
              { label: "Idade", value: fd.idade },
              { label: "Sexo biológico", value: fd.sexoBiologico },
              { label: "Identidade de gênero", value: fd.identidadeGenero },
              { label: "Orientação sexual", value: fd.orientacaoSexual },
              { label: "Estado civil", value: fd.estadoCivil },
              { label: "Religião", value: fd.religiao },
              { label: "Antecedentes", value: fd.antecedentes },
              { label: "CNH", value: fd.possuiCNH },
              { label: "Categoria CNH", value: fd.categoriaCNH },
            ]}
          />

          <CardSecaoPerfil
            emoji="👨‍👩‍👧‍👦"
            titulo="Filhos"
            pares={[
              { label: "Possui filhos", value: fd.possuiFilhos },
              { label: "Quantidade de filhos", value: fd.quantidadeFilhos },
              { label: "Faixa etária dos filhos", value: listaDeStrings(fd.faixaEtariaFilhos) },
            ]}
          />

          <CardSecaoPerfil
            emoji="📍"
            titulo="Localização"
            pares={[
              { label: "Estado", value: fd.estado },
              { label: "Cidade", value: fd.cidade },
              { label: "Mudança de cidade", value: fd.disponibilidadeMudanca },
              { label: "Aceita viagens", value: fd.aceitaViagens },
            ]}
          />

          <CardSecaoPerfil
            emoji="🎓"
            titulo="Formação"
            pares={[
              { label: "Escolaridade", value: fd.escolaridade },
              { label: "Curso", value: fd.cursoFormacao },
              { label: "Instituição", value: fd.instituicaoFormacao },
              { label: "Ano de conclusão", value: fd.anoConclusaoFormacao },
              {
                label: "Cursos",
                value: cursosDetalhados.length > 0
                  ? cursosDetalhados.map((c) => c.nome)
                  : cursos,
              },
              {
                label: "Certificações",
                value: certificacoesDetalhadas.length > 0
                  ? certificacoesDetalhadas.map((c) => c.nome)
                  : listaDeStrings(fd.certificacoes),
              },
              { label: "Idiomas", value: listaDeStrings(fd.idiomas) },
            ]}
          />

          <CardSecaoPerfil
            emoji="💼"
            titulo="Perfil profissional"
            pares={[
              { label: "Situação profissional", value: fd.situacaoProfissional },
              { label: "Área de interesse", value: fd.areaInteresse || resumo.area },
              { label: "Cargo desejado", value: valor("cargoDesejado") !== "—" ? valor("cargoDesejado") : resumo.cargo },
              { label: "Nível operacional", value: valor("nivelOperacional") !== "—" ? valor("nivelOperacional") : undefined },
              { label: "Área do nível", value: valor("areaNivel") !== "—" ? valor("areaNivel") : undefined },
              { label: "Detalhe do nível", value: valor("detalheNivel") !== "—" ? valor("detalheNivel") : undefined },
              { label: "Turno", value: (() => {
                const t = String(fd.turnoDisponivel || resumo.turno || "").trim();
                return t ? turnoPropostaLabel(t) : undefined;
              })() },
              { label: "Pretensão salarial", value: (() => {
                const v = String(formEdit.pretensaoSalarial || fd.pretensaoSalarial || "").trim();
                return v ? formatReaisDisplay(v) : undefined;
              })() },
              { label: "Recolocação", value: fd.recolocacao },
              { label: "Disponibilidade", value: fd.disponibilidadeInicio },
            ]}
          />

          {carreiraTimeline.length > 0 && (
            <div style={{ ...dashCard, padding: 18 }}>
              <h4
                style={{
                  ...goldTitle,
                  margin: "0 0 14px",
                  fontSize: 15,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span aria-hidden>📅</span>
                Linha do tempo profissional
              </h4>
              <CarreiraTimeline experiencias={empresas} showDescricao />
            </div>
          )}

          <CardSecaoPerfil
            emoji="🏭"
            titulo="Experiência na indústria"
            pares={[
              { label: "Trabalhou na indústria", value: fd.trabalhouIndustria },
              { label: "Tempo de experiência", value: fd.tempoExperiencia || resumo.experiencia },
              { label: "Segmentos", value: listaDeStrings(fd.segmentosIndustria) },
            ]}
          />

          <CardSecaoPerfil
            emoji="⚙️"
            titulo="Máquinas e equipamentos"
            pares={[
              { label: "Equipamentos", value: listaDeStrings(fd.maquinasEquipamentos) },
            ]}
          />

          <CardSecaoPerfil
            emoji="📋"
            titulo="Qualidade e processos"
            pares={[
              { label: "Qualidade", value: listaDeStrings(fd.qualidadeProcessos) },
            ]}
          />

          <CardSecaoPerfil
            emoji="💻"
            titulo="Informática"
            pares={[
              { label: "Informática", value: listaDeStrings(fd.informatica) },
            ]}
          />

          <CardSecaoPerfil
            emoji="✍️"
            titulo="Apresentação profissional"
            pares={[
              {
                label: "Mensagem para empresas",
                value: valor("mensagemEmpresas") !== "—" ? valor("mensagemEmpresas") : undefined,
              },
            ]}
          />
        </>
      ) : (
        <>
          <CardSecaoPerfil
            emoji="🏭"
            titulo="Dados pessoais"
            pares={[
              { label: "Nome", value: resumo.nome },
              { label: "Local", value: resumo.local },
              { label: "Escolaridade", value: resumo.escolaridade },
            ]}
          />
          <CardSecaoPerfil
            emoji="💼"
            titulo="Perfil profissional"
            pares={[
              { label: "Cargo", value: resumo.cargo },
              { label: "Área", value: resumo.area },
              { label: "Turno", value: turnoPropostaLabel(String(resumo.turno || "")) },
              { label: "Experiência", value: resumo.experiencia },
            ]}
          />
          <CardSecaoPerfil
            emoji="🏭"
            titulo="Experiência na indústria"
            pares={[
              { label: "Segmentos", value: resumo.segmentosIndustria },
              { label: "Equipamentos", value: resumo.maquinasEquipamentos },
            ]}
          />
        </>
      )}

      <section style={{ ...dashCard, padding: 18 }}>
        <h4
          style={{
            ...goldTitle,
            margin: "0 0 14px",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span aria-hidden>🧍</span>
          Sobre mim
        </h4>
        {resumo.bloqueado ? (
          <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
            Libere o contato para ver as informações pessoais do candidato.
          </p>
        ) : sobreMimPreenchido && sobreMim ? (
          <PerfilTextoCorrido
            pares={CAMPOS_SOBRE_MIM.map(({ key, label }) => ({
              label,
              value: sobreMim[key] || undefined,
            }))}
          />
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
            O candidato ainda não preencheu esta seção.
          </p>
        )}
      </section>

      <section style={{ ...dashCard, padding: 18 }}>
        <h4
          style={{
            ...goldTitle,
            margin: "0 0 14px",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span aria-hidden>🧠</span>
          Perfil pessoal
        </h4>
        {testeComportamental ? (
          (() => {
            const info = PERFIL_INFO[testeComportamental.perfilPrincipal];
            return (
              <div>
                <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: DASH.gold }}>
                  {info.emoji} Perfil predominante: {info.titulo}
                </p>
                <div>
                  <p style={{ ...labelStyle, marginBottom: 4 }}>Visão do recrutador</p>
                  <p style={{ ...valueStyle, fontSize: 13 }}>{info.visaoRecrutador}</p>
                </div>
              </div>
            );
          })()
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
            O candidato ainda não realizou o teste de perfil pessoal.
          </p>
        )}
      </section>

      <section style={{ ...dashCard, padding: 18 }}>
        <h4
          style={{
            ...goldTitle,
            margin: "0 0 14px",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span aria-hidden>📎</span>
          Currículo e anexos
        </h4>
        {resumo.bloqueado ? (
          <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
            Libere o contato para acessar currículo, atestados e demais anexos.
          </p>
        ) : (
          (() => {
            const docEscolar =
              formEdit && isArquivoAnexado(fd.documentoFormacao)
                ? String(fd.documentoFormacao)
                : "";
            const lista = [...documentos];
            if (docEscolar && !lista.some((d) => d.url === docEscolar)) {
              lista.unshift({ label: "Documento escolar", url: docEscolar });
            }
            if (lista.length === 0) {
              return (
                <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
                  Nenhum arquivo anexado pelo candidato.
                </p>
              );
            }
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lista.map((doc) => (
                  <a
                    key={`${doc.label}-${doc.url}`}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "10px 12px",
                      ...dashInnerBox,
                      borderRadius: 8,
                      textDecoration: "none",
                      color: DASH.text,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>📄 {doc.label}</span>
                    <span style={{ fontSize: 11, color: DASH.muted }}>{nomeArquivoAnexado(doc.url)}</span>
                  </a>
                ))}
              </div>
            );
          })()
        )}
      </section>
    </>
  );
}
