"use client";

import { usePathname } from "next/navigation";

export default function SiteEmailFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer
      style={{
        padding: "12px 16px 16px",
        textAlign: "center",
        background: "#FAF7F0",
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
    </footer>
  );
}
