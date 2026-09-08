"use client";

import React from "react";
import { avatarImageStyle } from "@/lib/theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import {
  DASH,
  dashPlanAccent,
} from "@/lib/dashboard-theme";
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
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        minWidth: 0,
      }}
    >
      {resumo.avatar ? (
        <img
          src={resumo.avatar}
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
            border: `1px solid ${DASH.gold}`,
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
            <h2 style={{ color: DASH.gold, margin: "0 0 6px", fontSize: 24, fontWeight: 700, flex: 1, minWidth: 0 }}>
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
                <OnlineStatusDot online={profissionalOnline} size={14} />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: profissionalOnline ? "#22c55e" : DASH.muted,
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
                    color: resumo.favorito ? "#e53935" : DASH.muted,
                    flexShrink: 0,
                    opacity: favoriting ? 0.7 : 1,
                  }}
                >
                  <BandeiraFavoritoIcon ativo={!!resumo.favorito} size={28} />
                </button>
              )}
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 15, color: DASH.text }}>
            {resumo.cargo || "—"} · {resumo.area || "—"}
          </p>
          {resumo.local && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: DASH.muted }}>{resumo.local}</p>
          )}
          <p style={{ margin: "6px 0 0", fontSize: 13, color: DASH.muted }}>
            {typeof resumo.compatibilidade === "number" && (
              <span style={dashPlanAccent}>Compatibilidade: {resumo.compatibilidade}% · </span>
            )}
            Completude: {resumo.profileCompletion ?? 0}%
          </p>
        </div>
        {resumo.bloqueado && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 13, color: DASH.muted, margin: "0 0 10px" }}>
              {!companyVerified
                ? "Para ver dados sensíveis, confirme o e-mail corporativo e aguarde a aprovação do cartão CNPJ — mesmo com plano pago."
                : "Perfil bloqueado — libere o contato para ver o cadastro completo."}
            </p>
            {canUnlock && companyVerified && (
              <button
                type="button"
                onClick={onUnlock}
                disabled={unlocking}
                style={{
                  ...btnGold,
                  padding: "10px 18px",
                  fontSize: 13,
                  opacity: unlocking ? 0.7 : 1,
                }}
              >
                {unlocking ? "Desbloqueando..." : "🔓 Liberar contato"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
