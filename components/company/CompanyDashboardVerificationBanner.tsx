/* Autorizado no pacote UX+ops (09/2026): CTAs de verificação — escopo mínimo. */
"use client";

import React from "react";
import Link from "next/link";
import {
  COMPANY_FIELDS_NOTICE,
  COMPANY_VIEW_ONLY_NOTICE,
  type CompanyVerificationStatus,
} from "@/lib/company/company-verification";
import { DASH } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { exactUi } from "@/lib/i18n/exact-ui";

export type CompanyDashboardVerificationBannerProps = {
  verificationStatus: CompanyVerificationStatus;
  verificationReason: string | null;
  emailCorporativoVerificado: boolean;
  cartaoCnpjPreenchido?: boolean;
  emailCorporativoPreenchido?: boolean;
  /** ISO-3166 alpha-2; fora do BR o cartão CNPJ não é exigido. */
  countryCode?: string | null;
};

export default function CompanyDashboardVerificationBanner({
  verificationStatus,
  verificationReason,
  emailCorporativoVerificado,
  cartaoCnpjPreenchido = false,
  emailCorporativoPreenchido = false,
  countryCode = "BR",
}: CompanyDashboardVerificationBannerProps) {
  const isBrazil = (countryCode || "BR").trim().toUpperCase() === "BR";
  const isRejected = verificationStatus === "REJECTED";
  const isPending = verificationStatus === "PENDING";
  const docVerified = verificationStatus === "VERIFIED";
  const awaitingAdmin = isBrazil
    ? emailCorporativoVerificado && cartaoCnpjPreenchido && isPending
    : emailCorporativoVerificado && isPending;
  const camposVazios = isBrazil
    ? !cartaoCnpjPreenchido || !emailCorporativoPreenchido
    : !emailCorporativoPreenchido;
  const showCtas = !emailCorporativoVerificado || isPending || isRejected;

  return (
    <div style={{
      margin: "20px 24px 0",
      padding: 12,
      borderRadius: 16,
      border: `1px solid ${isRejected ? "#dc3545" : DASH.gold}`,
      background: isRejected ? "rgba(220,53,69,0.12)" : "rgba(200,155,60,0.12)",
    }}>
      <p style={{ margin: 0, fontSize: 13, color: DASH.text, lineHeight: 1.5 }}>
        <strong>{isRejected ? exactUi("Negado") : exactUi("Em análise")}</strong>
        {" "}— {isBrazil ? COMPANY_VIEW_ONLY_NOTICE : exactUi("Enquanto o e-mail corporativo não for verificado e a conta não for aprovada, o acesso a profissionais e à publicação de vagas fica limitado.")}
      </p>
      {camposVazios ? (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: DASH.muted, lineHeight: 1.45 }}>
          {isBrazil
            ? COMPANY_FIELDS_NOTICE
            : exactUi("O e-mail corporativo em branco não impede a entrada. Ele trava a publicação de vagas e a busca de profissionais até a verificação.")}
        </p>
      ) : null}
      <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, color: DASH.muted, lineHeight: 1.6 }}>
        <li>{emailCorporativoVerificado ? "✓" : "○"} {exactUi("E-mail corporativo confirmado por link")}</li>
        {isBrazil ? (
          <li>{docVerified ? "✓" : "○"} {exactUi("Cartão CNPJ anexado e aprovado pelo admin")}</li>
        ) : (
          <li>{docVerified ? "✓" : "○"} {exactUi("Conta aprovada pelo admin")}</li>
        )}
      </ul>
      {isRejected && verificationReason && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#f87171" }}>{verificationReason}</p>
      )}
      {awaitingAdmin && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: DASH.muted, lineHeight: 1.45 }}>
          {isBrazil
            ? exactUi("Após enviar o cartão CNPJ, a aprovação do admin costuma levar 1–2 dias úteis.")
            : exactUi("Após confirmar o e-mail, a aprovação do admin costuma levar 1–2 dias úteis.")}
        </p>
      )}
      {showCtas && (
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
              {exactUi("Confirmar e-mail corporativo")}
            </Link>
          )}
          {isBrazil && (isPending || isRejected) && (
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
              {exactUi(isRejected ? "Reenviar cartão CNPJ" : "Enviar cartão CNPJ")}
            </Link>
          )}
          {!isBrazil && (isPending || isRejected) && (
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
              {exactUi("Completar cadastro da empresa")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
