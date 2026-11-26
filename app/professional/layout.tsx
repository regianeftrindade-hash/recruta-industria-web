import type { Metadata } from "next";
import AuthSessionProvider from "@/components/auth/AuthSessionProvider";
import { resolveInterfaceLocale } from "@/lib/i18n/resolve-interface-locale";
import { t } from "@/lib/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveInterfaceLocale();
  return { title: t("seo.layout.professionalArea", locale) };
}

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
