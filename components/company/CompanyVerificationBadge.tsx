"use client";

import React from "react";
import {
  companyVerificationTag,
  companyVerificationTagStyle,
  type CompanyVerificationStatus,
} from "@/lib/company/company-verification";

export default function CompanyVerificationBadge({
  status,
  reason,
}: {
  status: CompanyVerificationStatus;
  reason?: string | null;
}) {
  const tag = companyVerificationTag({ verificationStatus: status });
  const cores = companyVerificationTagStyle(tag);
  const justificativa = reason?.trim() || "";

  return (
    <div style={{ marginTop: 12 }}>
      <span
        style={{
          display: "inline-block",
          padding: "4px 10px",
          borderRadius: 14,
          border: "2px solid #8D6B1F",
          background: cores.background,
          color: cores.color,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.04em",
        }}
      >
        {tag}
      </span>
      {tag === "Negado" && justificativa ? (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#3d1a1a", lineHeight: 1.45 }}>
          <strong>Justificativa: </strong>
          {justificativa}
        </p>
      ) : null}
    </div>
  );
}
