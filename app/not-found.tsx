import Link from "next/link";
import { resolveInterfaceLocale } from "@/lib/i18n/resolve-interface-locale";
import { t } from "@/lib/i18n/translate";

export default async function NotFound() {
  const locale = await resolveInterfaceLocale();

  return (
    <main
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
          {t("error.global.title", locale)}
        </h1>
        <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.5 }}>
          {t("error.global.body", locale)}
        </p>
        <Link href="/" className="ri-btn-3d-gold">
          {t("surface.jobs.home", locale)}
        </Link>
      </div>
    </main>
  );
}
