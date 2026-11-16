"use client";

import { usePathname } from "next/navigation";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";
import type { SupportedLocale } from "@/lib/i18n/locales";

export default function SiteEmailFooter({ locale }: { locale: SupportedLocale }) {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer
      style={{
        padding: "12px 16px 16px",
        textAlign: "center",
        background: "#F3E6C8",
        borderTop: "1px solid rgba(141, 107, 31, 0.65)",
      }}
    >
      <a
        href="mailto:contato@recrutaindustria.com"
        style={{
          color: "#414141",
          fontSize: "0.84rem",
          textDecoration: "none",
        }}
      >
        contato@recrutaindustria.com
      </a>
      <LanguageSwitch current={locale} />
    </footer>
  );
}
