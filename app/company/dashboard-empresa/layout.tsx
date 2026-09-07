/* 🔒 BLOQUEADO (06/07/2026) — não editar sem pedido explícito. Ver .cursor/rules/dashboard-page-lock.mdc */
import { Suspense } from "react";
import CompanyDashboardFrame from "@/components/company/CompanyDashboardFrame";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import { DASH } from "@/lib/dashboard-theme";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AmpulhetaLoading label="Carregando..." size={42} color={DASH.gold} />
        </div>
      }
    >
      <CompanyDashboardFrame>{children}</CompanyDashboardFrame>
    </Suspense>
  );
}
