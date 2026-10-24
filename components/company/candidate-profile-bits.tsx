"use client";

import React from "react";
import {
  CURSO_STATUS_META,
  getCursoStatus,
  type CursoDetalhado,
  type CertificacaoDetalhada,
} from "@/lib/professional-form-config";
import type { SobreMimData } from "@/lib/sobre-mim";
import {
  DASH,
  dashCard,
  dashInnerBox,
} from "@/lib/dashboard-theme";
import {
  botaoPerfil,
  COR_PRETO,
  textoAviso,
  textoDourado,
  textoPretoNegrito,
} from "@/lib/ui/perfil-empresa-cores";

function tintaSelo(status: ReturnType<typeof getCursoStatus>): React.CSSProperties {
  if (status === "vencido" || status === "nao_enviado" || status === "sem_certificado") return textoAviso;
  return textoDourado;
}

export const goldTitle: React.CSSProperties = {
  ...textoDourado,
  letterSpacing: "0.01em",
  textDecoration: "none",
};

export const CAMPOS_SOBRE_MIM: Array<{ key: keyof SobreMimData; label: string }> = [
  { key: "hobbys", label: "Hobbies" },
  { key: "estiloMusical", label: "Estilo musical" },
  { key: "livros", label: "Livros" },
  { key: "filmesSeries", label: "Filmes e séries" },
  { key: "fraseQueDefine", label: "Uma frase que define" },
  { key: "assuntosInteresse", label: "Assuntos de interesse" },
];

const fieldBox: React.CSSProperties = {
  padding: "10px 12px",
  ...dashInnerBox,
  border: "2px solid #000",
  borderRadius: 8,
  minHeight: 40,
  background: DASH.inner,
};

export const labelStyle: React.CSSProperties = {
  ...textoDourado,
  margin: "0 0 4px",
  fontSize: 14,
  lineHeight: 1.35,
  textTransform: "uppercase",
  letterSpacing: "0.01em",
};

export const valueStyle: React.CSSProperties = {
  color: COR_PRETO,
  fontSize: 16,
  fontWeight: 400,
  margin: 0,
  lineHeight: 1.5,
  wordBreak: "break-word",
  textShadow: "none",
};

export function Campo({ label, value, span = 1 }: { label: string; value?: unknown; span?: number }) {
  const text = value === undefined || value === null || value === "" ? "—" : String(value);
  return (
    <div style={{ ...fieldBox, gridColumn: span > 1 ? `span ${span}` : undefined }}>
      <p style={labelStyle}>{label}</p>
      <p style={valueStyle}>{text}</p>
    </div>
  );
}

const DestacarVaziosContext = React.createContext(false);

export function DestacarVaziosProvider({
  ativo,
  children,
}: {
  ativo: boolean;
  children: React.ReactNode;
}) {
  return <DestacarVaziosContext.Provider value={ativo}>{children}</DestacarVaziosContext.Provider>;
}

function valorVazio(value: unknown): boolean {
  if (value === undefined || value === null || value === "" || value === "—") return true;
  if (Array.isArray(value)) return !value.some((item) => String(item || "").trim());
  return String(value).trim().length === 0;
}

function textoValor(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(" · ");
  return String(value ?? "").trim();
}

export function PerfilTextoCorrido({
  pares,
}: {
  pares: Array<{ label: string; value?: unknown }>;
}) {
  const destacarVazios = React.useContext(DestacarVaziosContext);
  const partes = pares
    .map(({ label, value }) => {
      const vazio = valorVazio(value);
      if (vazio && !destacarVazios) return null;
      const texto = vazio ? "" : textoValor(value);
      if (!vazio && (!texto || texto === "—")) return null;
      return { label, texto, vazio };
    })
    .filter(Boolean) as Array<{ label: string; texto: string; vazio: boolean }>;

  if (partes.length === 0) {
    return <p style={valueStyle}>Sem dados para exibir.</p>;
  }

  const linhaInteira = (label: string, texto: string) => {
    if (/mensagem|apresenta|sobre mim|faixa etária|equipamentos|qualidade|informática|segmentos|cursos|certifica/i.test(label)) {
      return texto.length > 28;
    }
    return texto.length > 90;
  };

  const labelEl = (label: string) => (
    <span
      style={{
        ...textoDourado,
        fontSize: 16,
        lineHeight: 1.45,
        textDecoration: "none",
      }}
    >
      {label}
    </span>
  );

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: 18,
        rowGap: 12,
        alignItems: "baseline",
        width: "100%",
      }}
    >
      {partes.map((item) => {
        if (item.vazio) {
          return (
            <span
              key={item.label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                ...textoAviso,
                padding: "3px 10px",
                border: "2px solid #000",
                borderRadius: 999,
                fontSize: 14,
                lineHeight: 1.35,
              }}
            >
              {item.label}
            </span>
          );
        }
        const full = linhaInteira(item.label, item.texto);
        return (
          <p
            key={`${item.label}-${item.texto}`}
              style={{
                margin: 0,
                color: COR_PRETO,
                fontSize: 16,
                fontWeight: 400,
                lineHeight: 1.5,
                textShadow: "none",
              flex: full ? "1 1 100%" : "0 0 auto",
              whiteSpace: full ? "normal" : "nowrap",
              wordBreak: full ? "break-word" : undefined,
              maxWidth: full ? "100%" : undefined,
            }}
          >
            {labelEl(item.label)}
            {": "}
            {item.texto}
          </p>
        );
      })}
    </div>
  );
}

export function CardSecaoPerfil({
  emoji,
  titulo,
  pares,
}: {
  emoji: string;
  titulo: string;
  pares: Array<{ label: string; value?: unknown }>;
}) {
  const destacarVazios = React.useContext(DestacarVaziosContext);
  const temDados = pares.some(({ value }) => !valorVazio(value));
  if (!temDados && !destacarVazios) return null;

  return (
    <section data-perfil-card="1" style={{ ...dashCard, padding: 18 }}>
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
        <span aria-hidden>{emoji}</span>
        {titulo}
      </h4>
      <PerfilTextoCorrido pares={pares} />
    </section>
  );
}

export function listaDeStrings(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function TagList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p style={valueStyle}>—</p>;
  }
  return (
    <p style={{ ...valueStyle, margin: 0 }}>
      {items.join(" · ")}
    </p>
  );
}

function formatarDataCurta(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { year: "numeric", month: "2-digit" });
}

export function CursoDetalheItem({ curso }: { curso: CursoDetalhado }) {
  const status = getCursoStatus(curso);
  const badge = CURSO_STATUS_META[status];
  const linhaSecundaria = [curso.instituicao, curso.cargaHoraria, formatarDataCurta(curso.dataConclusao)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: 8,
        border: "2px solid #000",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: 13, ...textoPretoNegrito }}>{curso.nome}</p>
        <span
          style={{
            ...tintaSelo(status),
            fontSize: 13,
            padding: "3px 8px",
            borderRadius: 999,
            border: "2px solid #000",
            background: "transparent",
            whiteSpace: "nowrap",
          }}
        >
          {badge.label}
        </span>
      </div>
      {linhaSecundaria && (
        <p style={{ margin: 0, fontSize: 11, color: COR_PRETO }}>{linhaSecundaria}</p>
      )}
      {curso.certificadoUrl && (
        <a
          href={curso.certificadoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...textoDourado, fontSize: 14, textDecoration: "underline", marginTop: 2 }}
        >
          Ver anexo
        </a>
      )}
    </div>
  );
}

export function CertificacaoDetalheItem({ cert }: { cert: CertificacaoDetalhada }) {
  const status = getCursoStatus({
    nome: cert.nome,
    validadeCertificado: cert.validade,
    possuiCertificado: cert.possuiCertificado,
    certificadoUrl: cert.certificadoUrl,
    verificado: cert.verificado,
  });
  const badge = CURSO_STATUS_META[status];
  const linhaSecundaria = [cert.emissor, formatarDataCurta(cert.validade)].filter(Boolean).join(" · ");

  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: 8,
        border: "2px solid #000",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: 13, ...textoPretoNegrito }}>{cert.nome}</p>
        {cert.certificadoUrl && (
          <span
            style={{
              ...tintaSelo(status),
              fontSize: 13,
              padding: "3px 8px",
              borderRadius: 999,
              border: "2px solid #000",
              background: "transparent",
              whiteSpace: "nowrap",
            }}
          >
            {badge.label}
          </span>
        )}
      </div>
      {linhaSecundaria && (
        <p style={{ margin: 0, fontSize: 11, color: COR_PRETO }}>{linhaSecundaria}</p>
      )}
      {cert.certificadoUrl && (
        <a
          href={cert.certificadoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...textoDourado, fontSize: 14, textDecoration: "underline", marginTop: 2 }}
        >
          Ver anexo
        </a>
      )}
    </div>
  );
}

export function SimNaoToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div
      style={{
        ...fieldBox,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <p style={{ ...labelStyle, margin: 0 }}>{label}</p>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {[
          { label: "Sim", active: value },
          { label: "Não", active: !value },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.label === "Sim")}
            style={{
              padding: "4px 12px",
              fontSize: 11,
              borderRadius: 7,
              cursor: "pointer",
              fontWeight: 600,
              ...(opt.active ? { ...botaoPerfil, ...textoDourado } : botaoPerfil),
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
