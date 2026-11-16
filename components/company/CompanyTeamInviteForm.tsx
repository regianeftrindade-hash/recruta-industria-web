"use client";
import { exactUi } from "@/lib/i18n/exact-ui";

import React from "react";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import {
  DASH,
  dashInnerBox,
  dashInput,
  dashLabel,
} from "@/lib/dashboard-theme";

export type CompanyTeamInviteFormProps = {
  replacingId: string | null;
  name: string;
  email: string;
  role: string;
  error: string;
  atLimit: boolean;
  canInvite: boolean;
  saving: boolean;
  lastInviteUrl: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
};

export default function CompanyTeamInviteForm({
  replacingId,
  name,
  email,
  role,
  error,
  atLimit,
  canInvite,
  saving,
  lastInviteUrl,
  onNameChange,
  onEmailChange,
  onRoleChange,
  onSubmit,
  onCancel,
}: CompanyTeamInviteFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      style={{ ...dashInnerBox, padding: 14, display: "grid", gap: 10, marginBottom: 12 }}
    >
      <p style={{ margin: 0, fontSize: 13, color: DASH.gold, fontWeight: 800 }}>
        {replacingId ? exactUi("Trocar usuário") : exactUi("Adicionar novo usuário")}
      </p>
      {replacingId ? (
        <p style={{ margin: 0, fontSize: 11, color: DASH.muted }}>
          O usuário atual será removido e o assento fica com o novo e-mail. Não precisa
          comprar outro plano.
        </p>
      ) : null}
      <label>
        <span style={{ ...dashLabel, display: "block", marginBottom: 4 }}>{exactUi("Nome")}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={exactUi("Nome completo")}
          style={dashInput}
        />
      </label>
      <label>
        <span style={{ ...dashLabel, display: "block", marginBottom: 4 }}>{exactUi("E-mail")}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="maria@empresa.com.br"
          style={dashInput}
        />
      </label>
      <label>
        <span style={{ ...dashLabel, display: "block", marginBottom: 4 }}>{exactUi("Função")}</span>
        <select value={role} onChange={(e) => onRoleChange(e.target.value)} style={dashInput}>
          <option value="RH">RH</option>
          <option value="RECRUITER">{exactUi("Recrutador")}</option>
          <option value="ADMIN">Admin</option>
        </select>
      </label>
      {error ? <p style={{ margin: 0, color: "#f87171", fontSize: 12 }}>{error}</p> : null}

      {atLimit && !replacingId ? (
        <p style={{ margin: 0, fontSize: 12, color: DASH.muted, lineHeight: 1.5 }}>
          Sua empresa atingiu o limite do plano. Escolha um pacote abaixo para liberar
          assentos e depois conclua o cadastro.
        </p>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={saving || (!canInvite && !replacingId)}
            style={{ ...btnGold, padding: "8px 12px", fontSize: 12 }}
          >
            {saving
              ? exactUi("Salvando...")
              : replacingId
                ? exactUi("Confirmar troca")
                : exactUi("Gerar convite")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "transparent",
              border: `1px solid ${DASH.muted}`,
              color: DASH.muted,
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {lastInviteUrl ? (
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: DASH.muted,
            lineHeight: 1.45,
            wordBreak: "break-all",
          }}
        >
          Link do convite (copiado): {lastInviteUrl}
        </p>
      ) : null}
    </form>
  );
}
