"use client";

import { usePathname } from "next/navigation";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";
import { showsGlobalLocaleBar } from "@/lib/i18n/locale-switch-placement";
import type { SupportedLocale } from "@/lib/i18n/locales";

export default function SiteLocaleBar({ locale }: { locale: SupportedLocale }) {
  const pathname = usePathname() || "/";
  if (!showsGlobalLocaleBar(pathname)) return null;

  return (
    <div className="ri-locale-bar">
      <LanguageSwitch current={locale} />
    </div>
  );
}
