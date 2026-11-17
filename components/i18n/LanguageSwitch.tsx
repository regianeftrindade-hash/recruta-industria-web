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
    <label className="ri-locale-switch">
      <span>{t("locale.switchLabel")}</span>
      <select
        data-locale-switch=""
        aria-label={t("locale.switchLabel")}
        aria-invalid={error ? true : undefined}
        value={current}
        onChange={(event) => {
          void choose(event.target.value as SupportedLocale);
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
