"use client";

import { useEffect } from "react";
import { t } from "@/lib/i18n/translate";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      role="alert"
      style={{
        minHeight: "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#F3E6C8",
        color: "#414141",
      }}
    >
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ color: "#C89B3C", fontSize: 22, margin: "0 0 12px" }}>
          {t("error.global.title")}
        </h1>
        <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.5 }}>
          {t("error.global.body")}
        </p>
        <button type="button" className="ri-btn-3d-gold" onClick={() => reset()}>
          {t("error.global.retry")}
        </button>
      </div>
    </main>
  );
}
