"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Emergency restore: the full company register page was temporarily damaged.
 * Route users to the dedicated company cadastro flow which remains intact.
 * Full page will be restored in the following commit from repository history.
 */
function RedirectBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const edit = searchParams.get("edit");
    const qs = edit === "1" ? "?edit=1" : "";
    router.replace(`/company/cadastro${qs}`);
  }, [router, searchParams]);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3E6C8", color: "#414141" }}>
      Redirecionando…
    </div>
  );
}

export default function CadastroEmpresaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#F3E6C8" }} />}>
      <RedirectBody />
    </Suspense>
  );
}
