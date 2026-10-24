"use client";

import React from "react";
import Link from "next/link";
import { avatarImageStyle } from "@/lib/theme";
import { fotoPerfilSrc } from "@/lib/professional/foto-perfil";
import { DASH } from "@/lib/dashboard-theme";
import {
  botaoPerfil,
  COR_DOURADO,
  COR_PRETO,
  textoAviso,
  textoDourado,
  textoPreto,
  textoPretoNegrito,
} from "@/lib/ui/perfil-empresa-cores";
import BandeiraFavoritoIcon from "@/components/company/BandeiraFavoritoIcon";
import OnlineStatusDot from "@/components/shared/OnlineStatusDot";
import type { Resumo } from "@/components/company/company-candidate-profile-types";

type Props = {
  resumo: Resumo;
  infoRef: React.RefObject<HTMLDivElement | null>;
  profissionalOnline: boolean;
  canFavorite: boolean;
  favoriting: boolean;
  onFavorite: () => void;
  companyVerified: boolean;
  canUnlock: boolean;
  unlocking: boolean;
  onUnlock: () => void;
  actionFeedback?: { tone: "ok" | "err"; text: string } | null;
};

export default function CompanyCandidateProfileHeader({
  resumo,
  infoRef,
  profissionalOnline,
  canFavorite,
  favoriting,
  onFavorite,
  companyVerified,
  canUnlock,
  unlocking,
  onUnlock,
  actionFeedback,
}: Props) {
  const avatarSrc = fotoPerfilSrc(resumo.avatar);
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        minWidth: 0,
      }}
    >
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt=""
          style={{
            ...avatarImageStyle(88),
            flexShrink: 0,
            filter: resumo.bloqueado ? "blur(4px)" : "none",
          }}
        />
      ) : (
        <div
          style={{
            width: 88,
            height: 88,
            flexShrink: 0,
            borderRadius: "50%",
            background: DASH.inner,
            border: "2px solid #000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
          }}
        >
          👤
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div ref={infoRef}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, justifyContent: "space-between" }}>
            <h2 style={{ ...textoDourado, margin: "0 0 6px", fontSize: 24, flex: 1, minWidth: 0 }}>
              {resumo.nome}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <OnlineStatusDot
                  online={profissionalOnline}
                  size={14}
                  style={{
                    background: profissionalOnline ? COR_DOURADO : "transparent",
                    border: "2px solid #000",
                    boxShadow: "none",
                  }}
                />
                <span
                  style={{
                    ...(profissionalOnline ? textoDourado : textoPreto),
                    fontSize: 9,
                    lineHeight: 1,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  {profissionalOnline ? "Online" : "Offline"}
                </span>
              </div>
              {canFavorite && (
                <button
                  type="button"
                  onClick={() => void onFavorite()}
                  disabled={favoriting}
                  title={resumo.favorito ? "Remover dos favoritos" : "Marcar como favorito"}
                  aria-label={resumo.favorito ? "Remover dos favoritos" : "Marcar como favorito"}
                  aria-pressed={!!resumo.favorito}
                  style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    padding: 4,
                    margin: 0,
                    cursor: favoriting ? "wait" : "pointer",
                    lineHeight: 0,
                    color: COR_PRETO,
                    flexShrink: 0,
                    opacity: favoriting ? 0.7 : 1,
                  }}
                >
                  <BandeiraFavoritoIcon ativo={!!resumo.favorito} size={28} />
                </button>
              )}
            </div>
          </div>
          <p style={{ ...textoPretoNegrito, margin: 0, fontSize: 15 }}>
            {resumo.cargo || "—"} · {resumo.area || "—"}
          </p>
          {resumo.local && (
            <p style={{ ...textoPreto, margin: "4px 0 0", fontSize: 13 }}>{resumo.local}</p>
          )}
          <p style={{ ...textoPreto, margin: "6px 0 0", fontSize: 13 }}>
            {typeof resumo.compatibilidade === "number" && (
              <span style={textoPretoNegrito}>Compatibilidade: {resumo.compatibilidade}% · </span>
            )}
            Completude: {resumo.profileCompletion ?? 0}%
          </p>
        </div>
        {resumo.bloqueado && (
          <div style={{ marginTop: 14 }}>
            <p style={{ ...textoPreto, fontSize: 13, margin: "0 0 10px" }}>
              {!companyVerified
                ? "Para ver dados sensíveis, confirme o e-mail corporativo e aguarde a aprovação do cartão CNPJ — mesmo com plano pago."
                : !canUnlock
                  ? "Perfil bloqueado — faça upgrade do plano ou aguarde novas liberações do mês para ver o cadastro completo."
                  : "Perfil bloqueado — libere o contato para ver o cadastro completo."}
            </p>
            {!companyVerified ? (
              <Link
                href="/company/register"
                style={{
                  ...botaoPerfil,
                  display: "inline-block",
                  padding: "10px 18px",
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                Completar verificação
              </Link>
            ) : canUnlock ? (
              <button
                type="button"
                onClick={onUnlock}
                disabled={unlocking}
                style={{
                  ...botaoPerfil,
                  padding: "10px 18px",
                  fontSize: 13,
                  opacity: unlocking ? 0.7 : 1,
                }}
              >
                {unlocking ? "Desbloqueando..." : "🔓 Liberar contato"}
              </button>
            ) : (
              <Link
                href="/company/dashboard-empresa"
                style={{
                  ...botaoPerfil,
                  display: "inline-block",
                  padding: "10px 18px",
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                Ver planos e liberações
              </Link>
            )}
          </div>
        )}
        {actionFeedback ? (
          <p
            role="status"
            style={{
              margin: "10px 0 0",
              fontSize: 12,
              fontWeight: 700,
              ...(actionFeedback.tone === "ok" ? textoDourado : textoAviso),
              lineHeight: 1.45,
            }}
          >
            {actionFeedback.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
