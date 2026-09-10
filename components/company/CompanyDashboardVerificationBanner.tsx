/* Autorizado no pacote UX+ops (09/2026): CTAs de verificação — escopo mínimo. */
"use client";

import React from "react";
import Link from "next/link";
import type { CompanyVerificationStatus } from "@/lib/company/company-verification";
import { DASH } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";

export type CompanyDashboardVerificationBannerProps = {
  verificationStatus: CompanyVerificationStatus;
  verificationReason: string | null;
  emailCorporativoVerificado: boolean;
};

export default function CompanyDashboardVerificationBanner({
  verificationStatus,
  verificationReason,
  emailCorporativoVerificado,
}: CompanyDashboardVerificationBannerProps) {
  const docVerified = verificationStatus === "VERIFIED";
  const awaitingAdmin =
    emailCorporativoVerificado &&
    !docVerified &&
    verificationStatus !== "REJECTED";

  return (
    <div style={{
      margin: "20px 24px 0",
      padding: 12,
      borderRadius: 16,
      border: `1px solid ${verificationStatus === "REJECTED" ? "#dc3545" : DASH.gold}`,
      background: verificationStatus === "REJECTED" ? "rgba(220,53,69,0.12)" : "rgba(200,155,60,0.12)",
    }}>
      <p style={{ margin: 0, fontSize: 13, color: DASH.text, lineHeight: 1.5 }}>
        <strong>Liberação de contatos pendente</strong>
        {' '}— Você pode buscar profissionais, mas dados sensíveis só aparecem quando:
      </p>
      <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, color: DASH.muted, lineHeight: 1.6 }}>
        <li>{emailCorporativoVerificado ? '✓' : '○'} E-mail corporativo confirmado por link</li>
        <li>{docVerified ? '✓' : '○'} Cartão CNPJ anexado e aprovado pelo admin</li>
      </ul>
      {verificationStatus === "REJECTED" && verificationReason && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#f87171" }}>{verificationReason}</p>
      )}
      {awaitingAdmin && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: DASH.muted, lineHeight: 1.45 }}>
          Após enviar o cartão CNPJ, a aprovação do admin costuma levar 1–2 dias úteis.
        </p>
      )}
      {(!emailCorporativoVerificado || !docVerified || verificationStatus === "REJECTED") && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {!emailCorporativoVerificado && (
            <Link
              href="/company/register"
              style={{
                ...btnGold,
                display: "inline-block",
                padding: "8px 14px",
                fontSize: 12,
                textDecoration: "none",
              }}
            >
              Confirmar e-mail corporativo
            </Link>
          )}
          {(!docVerified || verificationStatus === "REJECTED") && (
            <Link
              href="/company/register"
              style={{
                ...btnGold,
                display: "inline-block",
                padding: "8px 14px",
                fontSize: 12,
                textDecoration: "none",
              }}
            >
              {verificationStatus === "REJECTED" ? "Reenviar cartão CNPJ" : "Enviar cartão CNPJ"}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
