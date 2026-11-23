"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { t } from "@/lib/i18n/translate";
import RegistrationCountryField from "@/components/identity/RegistrationCountryField";
import { AuthAtmosphere } from "@/components/shared/AuthAtmosphere";
import LogoRecruta from "@/app/components/LogoRecruta";
import layout from "./cadastro-empresa.module.css";

/**
 * Cadastro de empresa — Brasil (CNPJ/CPF) e internacional (sem documentos BR).
 */
function CadastroEmpresaForm({ incorporado = false }: { incorporado?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = incorporado || searchParams.get("edit") === "1";

  const [pais, setPais] = useState("BR");
  const [nome, setNome] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [email, setEmail] = useState("");
  const [emailCorporativo, setEmailCorporativo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [responsavelCpf, setResponsavelCpf] = useState("");
  const [endereco, setEndereco] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const isBrazil = pais === "BR";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk("");
    if (!nome.trim() || !responsavelNome.trim() || !email.trim()) {
      setError(t("registration.simple.nameRequired"));
      return;
    }
    if (!isEdit && (!password || password !== confirmPassword)) {
      setError(t("registration.simple.passwordMismatch"));
      return;
    }
    if (isBrazil && !cnpj.replace(/\D/g, "")) {
      setError(t("registration.ui.cnpj-invalido"));
      return;
    }
    if (isBrazil && !responsavelCpf.replace(/\D/g, "")) {
      setError(t("registration.ui.cpf-do-responsavel-invalido"));
      return;
    }
    if (!isBrazil && telefone && !telefone.trim().startsWith("+")) {
      setError("Informe o telefone com código do país, começando com +.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        userType: "company",
        countryCode: pais,
        name: nome.trim(),
        responsavelNome: responsavelNome.trim(),
        email: email.trim().toLowerCase(),
        emailCorporativo: (emailCorporativo || email).trim().toLowerCase(),
        telefone: telefone.trim(),
        endereco: endereco.trim(),
        password,
        confirmPassword,
      };
      if (isBrazil) {
        body.cnpj = cnpj.replace(/\D/g, "");
        body.responsavelCpf = responsavelCpf.replace(/\D/g, "");
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || t("registration.simple.createFailed"));
        setLoading(false);
        return;
      }
      setOk("Conta criada. Faça login para continuar.");
      if (!incorporado) {
        setTimeout(() => router.push("/login?tipo=empresa"), 1200);
      }
    } catch {
      setError(t("registration.simple.networkError"));
    } finally {
      setLoading(false);
    }
  };

  const field = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "2px solid #8D6B1F",
    background: "#F3E6C8",
    color: "#414141",
    marginBottom: 12,
    boxSizing: "border-box" as const,
  };
  const label = { display: "block", fontWeight: 600, marginBottom: 4, color: "#414141", fontSize: 13 };

  return (
    <div
      style={{
        position: "relative",
        minHeight: incorporado ? undefined : "100vh",
        background: "#F3E6C8",
        color: "#414141",
        padding: incorporado ? "16px" : "32px 16px",
      }}
    >
      {!incorporado ? <AuthAtmosphere /> : null}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto" }}>
        {!incorporado ? (
          <nav className={layout.voltarHome} aria-label={t("registration.ui.voltar-a-pagina-inicial")}>
            <Link href="/" className={layout.voltarHomeLink}>
              {t("registration.ui.voltar-a-pagina-inicial")}
            </Link>
          </nav>
        ) : null}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          {!incorporado ? <LogoRecruta /> : null}
          <h1 style={{ color: "#C89B3C", margin: "12px 0 4px" }}>{t("registration.ui.cadastro-empresa")}</h1>
          <p style={{ fontSize: 13, opacity: 0.85 }}>
            {isBrazil ? "Brasil — CNPJ e CPF do responsável" : "International — no Brazilian tax ID required"}
          </p>
        </div>

        <form onSubmit={submit} style={{ background: "#E8D5A3", border: "1px solid rgba(200,155,60,0.7)", borderRadius: 16, padding: 20 }}>
          <RegistrationCountryField id="empresa-pais" value={pais} onChange={setPais} />

          <label style={label}>{t("registration.ui.razao-social")}</label>
          <input style={field} value={nome} onChange={(e) => setNome(e.target.value)} required />

          <label style={label}>{t("registration.ui.nome-do-responsavel")}</label>
          <input style={field} value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} required />

          <label style={label}>{t("registration.simple.email")}</label>
          <input style={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label style={label}>{t("registration.ui.email-corporativo-label")}</label>
          <input
            style={field}
            type="email"
            value={emailCorporativo}
            onChange={(e) => setEmailCorporativo(e.target.value)}
            placeholder={email || "company@example.com"}
          />

          <label style={label}>{isBrazil ? t("registration.simple.phone") : "Phone (E.164, e.g. +1…)"}</label>
          <input
            style={field}
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder={isBrazil ? "(11) 99999-9999" : "+351 912 345 678"}
          />

          <label style={label}>{t("registration.ui.endereco")}</label>
          <input style={field} value={endereco} onChange={(e) => setEndereco(e.target.value)} />

          {isBrazil && (
            <>
              <label style={label}>{t("registration.ui.cnpj")}</label>
              <input style={field} value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
              <label style={label}>{t("registration.ui.cpf-do-responsavel")}</label>
              <input style={field} value={responsavelCpf} onChange={(e) => setResponsavelCpf(e.target.value)} placeholder="000.000.000-00" />
            </>
          )}

          {!isEdit && (
            <>
              <label style={label}>{t("registration.simple.password")}</label>
              <input style={field} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              <label style={label}>{t("registration.simple.confirmPassword")}</label>
              <input style={field} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
            </>
          )}

          {error && <p style={{ color: "#8B0000", fontSize: 13 }}>{error}</p>}
          {ok && <p style={{ color: "#2E7D32", fontSize: 13 }}>{ok}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 8,
              padding: 14,
              borderRadius: 12,
              border: "2px solid #8D6B1F",
              background: "#D4AF37",
              color: "#414141",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "…" : t("registration.simple.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}

function CadastroEmpresaPageInner({ incorporado = false }: { incorporado?: boolean }) {
  return (
    <Suspense fallback={<div style={{ minHeight: incorporado ? 120 : "100vh", background: "#F3E6C8" }} />}>
      <CadastroEmpresaForm incorporado={incorporado} />
    </Suspense>
  );
}

/** Default export: page + dashboard embed (`incorporado`). */
export default function CadastroEmpresa({ incorporado = false }: { incorporado?: boolean } = {}) {
  return <CadastroEmpresaPageInner incorporado={incorporado} />;
}
