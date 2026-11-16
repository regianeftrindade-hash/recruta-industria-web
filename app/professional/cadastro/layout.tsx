import type { Metadata } from "next";
import { resolveInterfaceLocale } from "@/lib/i18n/resolve-interface-locale";
import { t } from "@/lib/i18n/translate";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveInterfaceLocale();
  return {
    title: t("registration.simple.metaTitle", locale),
    description: t("registration.simple.metaDescription", locale),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
