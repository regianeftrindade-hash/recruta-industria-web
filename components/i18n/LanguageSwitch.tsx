"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n/translate";
import { requestLocaleChange } from "@/lib/i18n/locale-switch";
import { LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n/locales";

export default function LanguageSwitch({ current }: { current: SupportedLocale }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const options = SUPPORTED_LOCALES.map((locale) => ({
    locale,
    label: LOCALE_NATIVE_NAMES[locale],
  }));

  async function choose(locale: SupportedLocale) {
    if (locale === current) return;
    setError(null);
    try {
      const result = await requestLocaleChange(locale);
      if (!result.ok) {
        setError(result.reason === "network" ? t("fix.test.network") : t("locale.invalid"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("fix.test.network"));
    }
  }

  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginLeft: 12, fontSize: "0.78rem", color: "#414141" }}>
      <span>{t("locale.switchLabel")}</span>
      <select
        aria-label={t("locale.switchLabel")}
        aria-invalid={error ? true : undefined}
        value={current}
        onChange={(event) => {
          void choose(event.target.value as SupportedLocale);
        }}
        style={{
          border: "1px solid #8D6B1F",
          background: "#F3E6C8",
          color: "#414141",
          borderRadius: 6,
          padding: "2px 8px",
          fontSize: "0.78rem",
        }}
      >
        {options.map((option) => (
          <option key={option.locale} value={option.locale}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span role="alert">{error}</span> : null}
    </label>
  );
}
