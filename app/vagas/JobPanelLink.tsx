"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./vagas.module.css";

export default function JobPanelLink() {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    void fetch("/api/auth/session", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelado || !data?.user) return;
        const tipo = String(data.user.userType || "").toUpperCase();
        setHref(tipo === "COMPANY"
          ? "/company/dashboard-empresa"
          : tipo === "ADMIN"
            ? "/admin"
            : "/professional/dashboard");
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  if (!href) return null;

  return (
    <Link href={href} className={`${styles.panelLink} ri-btn-3d-gold`}>
      Ir para o seu painel
    </Link>
  );
}
