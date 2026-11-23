/* 🔒 BLOQUEADO (06/07/2026) — não editar sem pedido explícito. Ver .cursor/rules/dashboard-page-lock.mdc */
/* Autorizado: i18n residual (finalização internacionalização) — metadata/title apenas. */
import type { Metadata } from "next";
import { Suspense } from "react";
import CompanyDashboardFrame from "@/components/company/CompanyDashboardFrame";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import { DASH } from "@/lib/dashboard-theme";
import "@/lib/i18n/active-locale.server";
import { bindLocale } from "@/lib/i18n/active-locale";
import { resolveInterfaceLocale } from "@/lib/i18n/resolve-interface-locale";
import { t } from "@/lib/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveInterfaceLocale();
  bindLocale(locale);
  return { title: t("fix.u.636", locale) };
}

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const locale = await resolveInterfaceLocale();
  bindLocale(locale);
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AmpulhetaLoading label={t("fix.upgrade.loading", locale)} size={42} color={DASH.gold} />
        </div>
      }
    >
      <CompanyDashboardFrame>{children}</CompanyDashboardFrame>
    </Suspense>
  );
}
