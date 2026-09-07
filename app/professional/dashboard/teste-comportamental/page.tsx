/* 🔒 BLOQUEADO (06/07/2026) — não editar sem pedido explícito. Ver .cursor/rules/dashboard-page-lock.mdc */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import DashboardThemeToggle from "@/app/components/DashboardThemeToggle";
import LogoRecruta from "@/app/components/LogoRecruta";
import "@/app/dashboard/dashboard-theme.css";
import {
  DASH,
  DashboardThemeShell,
  dashCard,
  dashHeader,
  dashInnerBox,
  dashSectionTitle,
} from "@/lib/dashboard-theme";
import {
  ESCALA_EXTREMOS,
  ESCALA_OPCOES,
  PERGUNTAS_TESTE,
  type ResultadoTesteComportamental,
} from "@/lib/teste-comportamental";

const TOTAL = PERGUNTAS_TESTE.length;
const dashTitleProf = { ...dashSectionTitle, color: DASH.gold };

export default function TesteComportamentalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const verificar = async () => {
      try {
        const res = await fetch("/api/professional/teste-comportamental", { credentials: "include" });
        if (res.status === 401) {
          router.replace("/login?tipo=profissional");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.completed) {
            router.replace("/professional/dashboard");
            return;
          }
        }
      } catch {
        setErro("Não foi possível carregar o teste.");
      } finally {
        setLoading(false);
      }
    };
    void verificar();
  }, [router]);

  const respondidas = Object.keys(respostas).length;
  const todasRespondidas = respondidas === TOTAL;

  const selecionar = (perguntaId: number, valor: number) => {
    setRespostas((prev) => ({ ...prev, [perguntaId]: valor }));
    setErro(null);
  };

  const handleEnviar = async () => {
    if (!todasRespondidas) {
      setErro(`Responda todas as ${TOTAL} perguntas antes de enviar.`);
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      const payload: Record<string, number> = {};
      for (let i = 1; i <= TOTAL; i++) {
        const nota = respostas[i];
        if (nota == null || nota < 1 || nota > 5) {
          setErro(`Responda todas as ${TOTAL} perguntas antes de enviar.`);
          setEnviando(false);
          return;
        }
        payload[String(i)] = nota;
      }

      const res = await fetch("/api/professional/teste-comportamental", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas: payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Não foi possível enviar o teste.");
        return;
      }

      const resultado = data.resultado as ResultadoTesteComportamental;
      try {
        sessionStorage.setItem("ri-teste-resultado", JSON.stringify(resultado));
      } catch {
        /* ignore */
      }

      router.push("/professional/dashboard");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <DashboardThemeShell className="ri-dash-prof">
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          Carregando teste...
        </div>
      </DashboardThemeShell>
    );
  }

  return (
    <DashboardThemeShell className="ri-dash-prof" style={{ width: "100%", maxWidth: "none" }}>
      <header style={{ ...dashHeader, padding: "14px 16px" }}>
        <LogoRecruta size="xs" as="span" depth />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <DashboardThemeToggle />
          <button
            type="button"
            onClick={() => router.push("/professional/dashboard")}
            style={{ ...btnGold, padding: "8px 14px", fontSize: 12 }}
          >
            Voltar
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "16px 14px 32px" }}>
        <section style={{ ...dashCard, padding: 18, marginBottom: 16, boxShadow: DASH.shadow }}>
          <h1 style={{ ...dashTitleProf, margin: "0 0 8px", fontSize: 20 }}>Teste Comportamental Pessoal</h1>
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: DASH.gold }}>
            Como você age no dia a dia
          </p>
          <p style={{ margin: 0, fontSize: 12, color: DASH.muted, lineHeight: 1.5 }}>
            Leia cada frase sobre sua vida e marque de <strong>1 a 5</strong>, onde{" "}
            <strong>1 = discordo plenamente</strong> e <strong>5 = concordo plenamente</strong>.
            O resultado mostra seu perfil pessoal predominante. Este teste pode ser preenchido{" "}
            <strong>apenas uma vez</strong>.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginTop: 14,
              padding: "10px 12px",
              ...dashInnerBox,
            }}
          >
            <span style={{ fontSize: 11, color: DASH.text, fontWeight: 600 }}>
              1 — {ESCALA_EXTREMOS.min.rotulo}
            </span>
            <span style={{ fontSize: 11, color: DASH.muted }}>···</span>
            <span style={{ fontSize: 11, color: DASH.text, fontWeight: 600, textAlign: "right" }}>
              5 — {ESCALA_EXTREMOS.max.rotulo}
            </span>
          </div>

          <p style={{ margin: "12px 0 0", fontSize: 11, color: DASH.muted }}>
            Progresso: {respondidas}/{TOTAL} perguntas
          </p>
          <div
            style={{
              marginTop: 6,
              height: 6,
              borderRadius: 99,
              background: DASH.input,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(respondidas / TOTAL) * 100}%`,
                height: "100%",
                background: DASH.gold,
                transition: "width 0.2s ease",
              }}
            />
          </div>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PERGUNTAS_TESTE.map((pergunta) => (
            <section key={pergunta.id} style={{ ...dashCard, padding: 14, boxShadow: DASH.shadow }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, lineHeight: 1.5, color: DASH.text }}>
                <span style={{ color: DASH.gold, fontWeight: 800, marginRight: 6 }}>{pergunta.id}.</span>
                {pergunta.texto}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: 9,
                  color: DASH.muted,
                  gap: 8,
                }}
              >
                <span>1 — Discordo plenamente</span>
                <span style={{ textAlign: "right" }}>5 — Concordo plenamente</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                {ESCALA_OPCOES.map((op) => {
                  const selecionado = respostas[pergunta.id] === op.valor;
                  return (
                    <button
                      key={op.valor}
                      type="button"
                      onClick={() => selecionar(pergunta.id, op.valor)}
                      aria-label={`Pergunta ${pergunta.id}: ${op.rotulo}`}
                      aria-pressed={selecionado}
                      title={op.rotulo}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        padding: "8px 4px",
                        border: `2px solid ${selecionado ? DASH.gold : DASH.border}`,
                        borderRadius: 10,
                        background: selecionado ? "var(--dash-gold-soft)" : DASH.input,
                        cursor: "pointer",
                        color: DASH.text,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          border: `2px solid ${selecionado ? DASH.gold : DASH.border}`,
                          background: selecionado ? DASH.gold : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 800,
                          color: selecionado ? "#1a1a1a" : DASH.muted,
                        }}
                      >
                        {op.valor}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {erro && (
          <p style={{ margin: "16px 0 0", fontSize: 12, color: "#e57373", textAlign: "center" }}>{erro}</p>
        )}

        <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => void handleEnviar()}
            disabled={enviando || !todasRespondidas}
            style={{
              ...btnGold,
              padding: "12px 28px",
              fontSize: 14,
              opacity: enviando || !todasRespondidas ? 0.65 : 1,
              cursor: enviando || !todasRespondidas ? "not-allowed" : "pointer",
            }}
          >
            {enviando ? "Enviando..." : "Finalizar e ver resultado"}
          </button>
        </div>
      </main>
    </DashboardThemeShell>
  );
}
