"use client";

import CompanyVagasPanel from "@/components/company/CompanyVagasPanel";
import shell from "../admin.module.css";

export default function AdminVagasPage() {
  return (
    <main className={shell.main}>
      <CompanyVagasPanel
        apiBase="/api/admin/vagas"
        profilePath={null}
        returnKey="ri-admin-vagas-return"
        showOrigin
      />
    </main>
  );
}
