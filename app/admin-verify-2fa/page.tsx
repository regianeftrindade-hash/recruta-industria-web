"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
import PageLoader from "@/app/components/PageLoader";
import styles from "@/app/login/login.module.css";

function AdminVerify2faContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const sendCode = async () => {
    setSending(true);
    setError("");
    setInfo("");
    setDevCode(null);
    try {
      const res = await fetch("/api/admin/2fa", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível enviar o código.");
        return;
      }
      setInfo(data.message || "Código enviado.");
      if (data.code) setDevCode(String(data.code));
    } catch {
      setError("Erro de rede ao enviar código.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/2fa", { credentials: "include" });
        if (res.status === 401) {
          router.replace("/login?redirect=/admin");
          return;
        }
        const data = await res.json();
        if (data.verified || data.required === false) {
          router.replace(nextPath.startsWith("/admin") ? nextPath : "/admin");
          return;
        }
        await sendCode();
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/2fa", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Código inválido.");
        return;
      }
      router.replace(nextPath.startsWith("/admin") ? nextPath : "/admin");
    } catch {
      setError("Erro ao validar código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.loginHeader}>
          <div className={styles.logoWrap}>
            <LogoRecruta size="sm" as="h1" depth />
          </div>
          <p className={styles.subtitle}>
            <span className={styles.accessTag}>Verificação Admin 2FA</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            Enviamos um código para o e-mail do administrador. Digite-o para continuar.
          </p>

          {error && <p className={styles.error}>{error}</p>}
          {info && (
            <p className={styles.error} style={{ color: "#86efac" }}>
              {info}
            </p>
          )}
          {devCode && (
            <p style={{ margin: 0, fontSize: 12, color: "#c89b3c" }}>
              Dev — código: <strong>{devCode}</strong>
            </p>
          )}

          <input
            className={styles.input}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Código de 6 dígitos"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
          />

          <button type="submit" disabled={loading || code.length < 6} className={styles.btnPrimary}>
            {loading ? "Validando..." : "Confirmar acesso"}
          </button>

          <button
            type="button"
            disabled={sending}
            onClick={() => void sendCode()}
            className={styles.btnSecondary}
          >
            {sending ? "Reenviando..." : "Reenviar código"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminVerify2faPage() {
  return (
    <Suspense fallback={<PageLoader message="Carregando..." />}>
      <AdminVerify2faContent />
    </Suspense>
  );
}
