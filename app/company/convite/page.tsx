"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { DASH, DashboardThemeShell, dashCard, dashInput, dashLabel } from "@/lib/dashboard-theme";
import "@/app/dashboard/dashboard-theme.css";

function ConviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("RH");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Link de convite inválido.");
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/company/team/accept?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Convite inválido ou expirado.");
          return;
        }
        setCompanyName(data.companyName || "Empresa");
        setEmail(data.email || "");
        setRole(data.role || "RH");
      } catch {
        setError("Erro ao validar convite.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/company/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Não foi possível criar a conta.");
        return;
      }
      alert(data.message || "Conta criada. Faça login na área de empresas.");
      router.push("/login/empresa");
    } catch {
      setError("Erro de rede ao aceitar convite.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="dash-card" style={{ ...dashCard, width: "100%", maxWidth: 420, padding: 24 }}>
      <LogoRecruta size="sm" as="h1" depth />
      <h2 style={{ margin: "16px 0 6px", fontSize: 18, color: DASH.gold }}>Convite para a equipe</h2>
      {loading ? (
        <AmpulhetaLoading label="Validando convite..." size={32} color={DASH.gold} />
      ) : error && !email ? (
        <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>
      ) : (
        <>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: DASH.text, lineHeight: 1.5 }}>
            Você foi convidado(a) para o RH de{" "}
            <strong style={{ color: DASH.gold }}>{companyName}</strong>
            {" "}como <strong>{role}</strong>. Crie seu nome e senha. Depois entre em{" "}
            <strong style={{ color: DASH.gold }}>/login/empresa</strong> com este e-mail — o sistema
            reconhece que você pertence a {companyName} e libera o mesmo painel da assinatura.
          </p>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <label>
              <span style={{ ...dashLabel, display: "block", marginBottom: 4 }}>E-mail</span>
              <input value={email} readOnly style={{ ...dashInput, opacity: 0.85 }} />
            </label>
            <label>
              <span style={{ ...dashLabel, display: "block", marginBottom: 4 }}>Seu nome</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex: Maria Silva"
                style={dashInput}
              />
            </label>
            <label>
              <span style={{ ...dashLabel, display: "block", marginBottom: 4 }}>Senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                style={dashInput}
              />
            </label>
            {error ? <p style={{ margin: 0, color: "#f87171", fontSize: 12 }}>{error}</p> : null}
            <button type="submit" disabled={saving} style={{ ...btnGold, padding: "10px 14px", fontSize: 13 }}>
              {saving ? "Criando conta..." : "Criar acesso"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

export default function CompanyConvitePage() {
  return (
    <DashboardThemeShell>
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <Suspense fallback={<AmpulhetaLoading label="Carregando..." size={32} color={DASH.gold} />}>
          <ConviteForm />
        </Suspense>
      </main>
    </DashboardThemeShell>
  );
}
