"use client";

import type { ReactNode } from "react";
import { bindLocale } from "@/lib/i18n/active-locale";
import type { SupportedLocale } from "@/lib/i18n/locales";

/** Shell leve na home — SessionProvider fica nos layouts autenticados. */
export default function Providers({
  locale,
  children,
}: {
  locale: SupportedLocale;
  children: ReactNode;
}) {
  bindLocale(locale);
  return children;
}
