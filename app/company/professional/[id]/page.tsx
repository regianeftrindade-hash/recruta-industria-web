"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { companyProfessionalPath } from "@/lib/profile/public-slug";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import { DASH, DashboardThemeShell } from "@/lib/dashboard-theme";

/** Redireciona URLs antigas /company/professional/[id] → /company/profissional/[slug]. */
export default function CompanyProfessionalLegacyRedirect() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    if (!id) {
      router.replace("/company/dashboard-empresa");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/company/professionals/resolve?ref=${encodeURIComponent(id)}`,
          { credentials: "include" },
        );
        const data = (await res.json().catch(() => ({}))) as { slug?: string; profileId?: string };
        if (cancelled) return;
        const target = data.slug || data.profileId || id;
        router.replace(companyProfessionalPath(target));
      } catch {
        if (!cancelled) router.replace(companyProfessionalPath(id));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  return (
    <DashboardThemeShell>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AmpulhetaLoading label="Abrindo perfil..." size={36} color={DASH.gold} />
      </div>
    </DashboardThemeShell>
  );
}
