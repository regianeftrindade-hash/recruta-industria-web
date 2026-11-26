"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n/translate";

export default function SiteEmailFooter() {
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
      <div style={{ marginBottom: 8 }}>
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
      </div>
      <nav
        aria-label={t("legal.termsOfUse")}
        style={{ fontSize: "0.72rem", color: "#414141" }}
      >
        <Link href="/termos/uso" style={{ color: "#414141", textDecoration: "none" }}>
          {t("legal.linkTermsOfUse")}
        </Link>
        {" · "}
        <Link href="/termos/privacidade" style={{ color: "#414141", textDecoration: "none" }}>
          {t("legal.linkPrivacy")}
        </Link>
        {" · "}
        <button
          type="button"
          onClick={() => {
            try {
              window.dispatchEvent(new Event("ri-open-cookie-settings"));
            } catch {
              // ignore
            }
          }}
          style={{
            color: "#414141",
            background: "none",
            border: "none",
            padding: 0,
            font: "inherit",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {t("privacy.cookieSettings")}
        </button>
      </nav>
    </footer>
  );
}
