/* 🔒 BLOQUEADO (06/07/2026) — não editar sem pedido explícito. Ver .cursor/rules/dashboard-page-lock.mdc */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Rota legada — redireciona para o dashboard unificado. */
export default function PainelRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/professional/dashboard");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      Redirecionando...
    </div>
  );
}
