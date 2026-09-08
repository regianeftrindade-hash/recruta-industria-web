/* 🔒 BLOQUEADO (06/07/2026) — não editar sem pedido explícito. Ver .cursor/rules/dashboard-page-lock.mdc */
"use client";

import React from "react";
import type { CompanyVerificationStatus } from "@/lib/company/company-verification";
import { DASH } from "@/lib/dashboard-theme";

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
        <li>{verificationStatus === "VERIFIED" ? '✓' : '○'} Cartão CNPJ anexado e aprovado pelo admin</li>
      </ul>
      {verificationStatus === "REJECTED" && verificationReason && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#f87171" }}>{verificationReason}</p>
      )}
    </div>
  );
}
