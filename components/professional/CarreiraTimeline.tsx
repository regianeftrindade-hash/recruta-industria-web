"use client";

import type { CSSProperties } from "react";
import {
  buildCareerTimeline,
  type CareerTimelineInput,
} from "@/lib/professional/career-timeline";
import { DASH } from "@/lib/dashboard-theme";
import { COR_DOURADO, COR_PRETO, textoDourado } from "@/lib/ui/perfil-empresa-cores";

type Props = {
  experiencias: CareerTimelineInput[] | null | undefined;
  /** Versão menor para o dashboard do profissional. */
  compact?: boolean;
  /** Mostra descrição da experiência (painel completo do recrutador). */
  showDescricao?: boolean;
  /** Perfil visto pela empresa: dourado escuro com contorno e texto preto. */
  paraEmpresa?: boolean;
  style?: CSSProperties;
};

export default function CarreiraTimeline({
  experiencias,
  compact = false,
  showDescricao = false,
  paraEmpresa = false,
  style,
}: Props) {
  const items = buildCareerTimeline(experiencias);
  if (items.length === 0) return null;

  const lineColor = paraEmpresa ? COR_DOURADO : DASH.gold;
  const corTexto = paraEmpresa ? COR_PRETO : DASH.text;
  const corSecundaria = paraEmpresa ? COR_PRETO : DASH.muted;
  const padLeft = compact ? 18 : 22;
  const fontSize = compact ? 11 : 13;
  const periodoSize = compact ? 10 : 12;

  return (
    <ol
      style={{
        listStyle: "none",
        margin: 0,
        padding: `4px 0 4px ${padLeft}px`,
        position: "relative",
        ...style,
      }}
    >
      {/* Linha vertical */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 6,
          top: 10,
          bottom: 10,
          width: 2,
          background: `linear-gradient(180deg, ${lineColor} 0%, color-mix(in srgb, ${lineColor} 35%, transparent) 100%)`,
          borderRadius: 2,
        }}
      />
      {items.map((item, index) => (
        <li
          key={`${item.sortKey}-${item.empresa}-${item.cargo}-${index}`}
          style={{
            position: "relative",
            paddingBottom: index === items.length - 1 ? 0 : compact ? 10 : 14,
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: -padLeft + 2,
              top: compact ? 4 : 5,
              width: compact ? 10 : 12,
              height: compact ? 10 : 12,
              borderRadius: "50%",
              background: DASH.card,
              border: `2px solid ${lineColor}`,
              boxShadow: `0 0 0 2px color-mix(in srgb, ${lineColor} 25%, transparent)`,
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: periodoSize,
              ...(paraEmpresa ? textoDourado : { fontWeight: 700, color: lineColor }),
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            {item.periodo}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize,
              fontWeight: 650,
              color: corTexto,
              lineHeight: 1.35,
            }}
          >
            {item.cargo}
            <span style={{ fontWeight: 500, color: corSecundaria }}> – {item.empresa}</span>
          </p>
          {item.segmento && !compact ? (
            <p style={{ margin: "2px 0 0", fontSize: 11, color: corSecundaria }}>
              {item.segmento}
            </p>
          ) : null}
          {showDescricao && item.descricao ? (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 11,
                color: corSecundaria,
                lineHeight: 1.45,
              }}
            >
              {item.descricao}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
