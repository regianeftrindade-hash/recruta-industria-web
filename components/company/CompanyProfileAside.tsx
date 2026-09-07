"use client";

import React, { useEffect } from "react";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import { useCompanyDashboardData } from "@/components/company/CompanyDashboardDataContext";
import {
  DASH,
  dashAside,
  dashInnerBox,
  dashLabel,
  dashPlanAccent,
  dashPlanBox,
  dashSectionTitle,
} from "@/lib/dashboard-theme";

/**
 * Coluna esquerda fixa — usa o cache compartilhado do perfil (sem fetch extra).
 */
export default function CompanyProfileAside() {
  const dash = useCompanyDashboardData();

  useEffect(() => {
    void dash.ensureChrome();
  }, [dash]);

  const companyProfile = dash.companyProfile;
  const slotsLabel = dash.slotsRestantes === null ? "∞" : String(dash.slotsRestantes ?? "…");

  return (
    <aside style={dashAside}>
      <h3 style={{ ...dashSectionTitle, margin: "0 0 12px", fontSize: 14 }}>
        🏢 Perfil da Empresa
        {dash.companyVerified ? (
          <span style={{ marginLeft: 8, fontSize: 10, color: "#4ade80", fontWeight: "bold" }}>✓ VERIFICADA</span>
        ) : null}
      </h3>

      {!dash.planReady && !companyProfile ? (
        <AmpulhetaLoading label="Carregando perfil..." size={28} color={DASH.gold} />
      ) : companyProfile ? (
        <div style={{ fontSize: 11, lineHeight: 1.6 }}>
          <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 16px" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 100,
                height: 100,
                borderRadius: "50%",
                overflow: "hidden",
                zIndex: 1,
                border: "none",
                boxShadow: `0 0 0 2px ${DASH.gold}`,
                background: companyProfile.logoUrl
                  ? "#0d0d0d"
                  : "linear-gradient(160deg, #e2c66c 0%, #c89b3c 45%, #8d6b1f 100%)",
              }}
            >
              {companyProfile.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={companyProfile.logoUrl}
                  alt="Logotipo da empresa"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "100%",
                    height: "100%",
                    minWidth: "100%",
                    minHeight: "100%",
                    objectFit: "cover",
                    objectPosition: "center 58%",
                    display: "block",
                    transform: "translate(-50%, -48%) scale(1.42)",
                  }}
                />
              ) : (
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#1a1208",
                    fontSize: 10,
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  Logo
                  <br />
                  empresa
                </span>
              )}
            </div>
            <div
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: `3px solid ${DASH.gold}`,
                overflow: "hidden",
                background: companyProfile.fotoResponsavelUrl ? DASH.inner : "#1a1a1a",
                zIndex: 2,
                boxShadow: `0 0 0 4px ${DASH.card}`,
              }}
            >
              {companyProfile.fotoResponsavelUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={companyProfile.fotoResponsavelUrl}
                  alt="Foto do responsável"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                />
              ) : (
                <span
                  style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    color: DASH.gold,
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Foto
                </span>
              )}
            </div>
          </div>

          {(
            [
              ["Razão social", companyProfile.razaoSocial],
              ["CNPJ", companyProfile.cnpj],
              ["Responsável", companyProfile.responsavelNome],
              ["CPF", companyProfile.responsavelCpf],
              ["E-mail de login", companyProfile.email],
              ["E-mail corporativo", companyProfile.emailCorporativo],
              ["Telefone", companyProfile.telefone],
              ["Endereço", companyProfile.endereco],
            ] as const
          ).map(([label, val]) => (
            <div
              key={label}
              style={{
                marginBottom: 8,
                padding: "6px 8px",
                ...dashInnerBox,
                border: `1px solid ${DASH.gold}`,
              }}
            >
              <p style={{ ...dashLabel, margin: "0 0 2px", fontSize: 10, textTransform: "uppercase" }}>{label}</p>
              <p style={{ color: DASH.text, margin: 0, fontSize: 12, wordBreak: "break-word" }}>{val || "—"}</p>
            </div>
          ))}

          <div style={{ marginTop: 12, ...dashPlanBox }}>
            <p style={{ ...dashPlanAccent, margin: "0 0 4px", fontSize: 10, fontWeight: "bold" }}>Plano atual</p>
            <p style={{ ...dashPlanAccent, margin: 0, fontSize: 16, fontWeight: "bold" }}>
              {dash.planReady && dash.planTier ? dash.planTier : "…"}
            </p>
            <p style={{ color: DASH.muted, margin: "8px 0 0", fontSize: 11 }}>
              Liberações restantes: {dash.planReady ? slotsLabel : "…"}
            </p>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 11, color: DASH.muted }}>Perfil da empresa indisponível.</p>
      )}
    </aside>
  );
}
