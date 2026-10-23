"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import DeleteAccountControl from "@/components/shared/DeleteAccountControl";
import { useCompanyDashboardData } from "@/components/company/CompanyDashboardDataContext";
import type { CompanyChromeProfile } from "@/components/company/CompanyDashboardDataContext";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { companyVerificationTag } from "@/lib/company/company-verification";
import {
  DASH,
  dashAside,
  dashCard,
  dashLabel,
  dashPlanAccent,
  dashPlanBox,
  dashSectionTitle,
} from "@/lib/dashboard-theme";

const CAMPOS_OBRIGATORIOS = [
  "razaoSocial",
  "cnpj",
  "responsavelNome",
  "responsavelCpf",
  "email",
  "emailCorporativo",
  "cartaoCnpjUrl",
] as const;

function completudeEmpresa(profile: CompanyChromeProfile): number {
  const valores = [
    ...CAMPOS_OBRIGATORIOS.map((chave) => String(profile[chave] || "").trim()),
    profile.emailCorporativoVerificado ? "ok" : "",
  ];
  const preenchidos = valores.filter(Boolean).length;
  return Math.round((preenchidos / valores.length) * 100);
}

/**
 * Coluna esquerda fixa — usa o cache compartilhado do perfil (sem fetch extra).
 */
export default function CompanyProfileAside({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const dash = useCompanyDashboardData();

  useEffect(() => {
    void dash.ensureChrome();
  }, [dash]);

  const companyProfile = dash.companyProfile;
  const slotsLabel = dash.slotsRestantes === null ? "∞" : String(dash.slotsRestantes ?? "…");
  const completude = companyProfile ? completudeEmpresa(companyProfile) : 0;

  if (compact) {
    const pct = companyProfile ? completude : 0;
    return (
      <section style={{ ...dashCard, padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            border: "2px solid #8D6B1F",
            background: "#E8D5A3",
          }}
        >
          {companyProfile?.fotoResponsavelUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={companyProfile.fotoResponsavelUrl}
              alt="Foto do perfil"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", color: "#414141", fontSize: 9, fontWeight: 700 }}>
              Foto
            </span>
          )}
        </div>
        <div>
          <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 16, color: DASH.title }}>
            {companyProfile?.razaoSocial || "Empresa"}
          </p>
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: 14,
              border: "2px solid #8D6B1F",
              background: "#E8C56A",
              color: "#414141",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.04em",
            }}
          >
            CADASTRO {pct}%
          </span>
        </div>
      </section>
    );
  }

  const verificationTag = dash.verificationStatus
    ? companyVerificationTag({
        verificationStatus: dash.verificationStatus,
        cartaoCnpjUrl: dash.companyProfile?.cartaoCnpjUrl,
        emailCorporativo: dash.companyProfile?.emailCorporativo,
      })
    : null;

  return (
    <aside style={{ ...dashAside, borderRight: "none", width: "100%", maxWidth: "none" }}>
      <h3 style={{ ...dashSectionTitle, margin: "0 0 12px", fontSize: 14 }}>
        🏢 Perfil da Empresa
        {verificationTag ? (
          <span style={{ marginLeft: 8, fontSize: 10, color: "#8D6B1F", fontWeight: "bold" }}>
            {verificationTag}
          </span>
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
                  ? "#E8D5A3"
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
                background: companyProfile.fotoResponsavelUrl ? DASH.inner : "#E8D5A3",
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
                    color: "#414141",
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

          <div style={{ margin: "0 0 12px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, letterSpacing: "0.04em", color: "#414141" }}>
              CADASTRO {completude}%
            </p>
            <div style={{ height: 10, borderRadius: 8, border: `2px solid #8D6B1F`, background: "#E8D5A3", overflow: "hidden" }}>
              <div
                style={{
                  width: `${completude}%`,
                  height: "100%",
                  background: completude >= 100 ? "#4ade80" : "linear-gradient(90deg, #8d6b1f, #c89b3c)",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", margin: "0 0 12px" }}>
            {dash.planReady && dash.isOwner ? (
              <button
                type="button"
                onClick={() => router.push("/company/register?edit=1")}
                style={{ ...btnGold, padding: "6px 10px", fontSize: 10, flexShrink: 0 }}
              >
                Atualizar cadastro
              </button>
            ) : null}
            <DeleteAccountControl variant="compact" />
          </div>

          <div
            style={{
              margin: "0 0 12px",
              padding: "12px 14px",
              background: "#E8D5A3",
              border: "2px solid #8D6B1F",
              borderRadius: 14,
            }}
          >
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "#000", lineHeight: 1.35 }}>
              Verificação de empresas: proteção para todos
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#414141", lineHeight: 1.5 }}>
              Golpistas podem utilizar nomes de empresas reais sem autorização para publicar falsas vagas e aplicar golpes. A verificação documental ajuda a proteger os candidatos contra fraudes e as empresas contra o uso indevido de seus nomes e identidades, tornando o Recruta Indústria um ambiente mais seguro e confiável.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 6 }}>
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
              ["Cartão CNPJ", companyProfile.cartaoCnpjUrl],
            ] as const
          ).map(([label, val]) => {
            const texto = typeof val === "string" ? val.trim() : "";
            return (
            <div
              key={label}
              style={{
                padding: "8px 10px",
                background: "#E8C56A",
                border: "2px solid #8D6B1F",
                borderRadius: 14,
              }}
            >
              <p style={{ ...dashLabel, margin: "0 0 2px", fontSize: 9, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                {label === "E-mail corporativo" && companyProfile.emailCorporativoVerificado ? (
                  <span aria-label="E-mail verificado" style={{ color: "#1b7a32", fontSize: 12, lineHeight: 1 }}>✓</span>
                ) : null}
                {label}
              </p>
              <p style={{ color: DASH.text, margin: 0, fontSize: 11, wordBreak: "break-word" }}>
                {typeof val === "string" && /^https?:\/\//i.test(val) ? (
                  <a href={val} target="_blank" rel="noopener noreferrer" style={{ color: "#414141", fontWeight: 700, textDecoration: "underline" }}>
                    Abrir arquivo
                  </a>
                ) : (
                  texto || "—"
                )}
              </p>
            </div>
            );
          })}
          </div>

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
