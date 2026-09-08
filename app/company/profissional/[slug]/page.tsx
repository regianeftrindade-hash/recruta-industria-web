"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import { DASH, DashboardThemeShell } from "@/lib/dashboard-theme";
import { looksLikeProfileCuid } from "@/lib/profile/public-slug";

/**
 * Rotas /company/profissional/... redirecionam para /company/professional/[id]
 * (abertura direta, sem API de resolve).
 */
function RedirectInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const idFromQuery = (searchParams.get("id") || "").trim();

  useEffect(() => {
    const id =
      (looksLikeProfileCuid(idFromQuery) && idFromQuery) ||
      (looksLikeProfileCuid(slug) && slug) ||
      "";
    if (id) {
      router.replace(`/company/professional/${encodeURIComponent(id)}`);
      return;
    }
    // Sem id: volta à vitrine (evita "Erro ao resolver perfil")
    router.replace("/company/dashboard-empresa");
  }, [slug, idFromQuery, router]);

  return (
    <DashboardThemeShell>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AmpulhetaLoading label="Abrindo perfil..." size={36} color={DASH.gold} />
      </div>
    </DashboardThemeShell>
  );
}

export default function CompanyProfissionalSlugRedirect() {
  return (
    <Suspense
      fallback={
        <DashboardThemeShell>
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AmpulhetaLoading label="Abrindo perfil..." size={36} color={DASH.gold} />
          </div>
        </DashboardThemeShell>
      }
    >
      <RedirectInner />
    </Suspense>
  );
}
