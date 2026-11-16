import type { Metadata } from "next";
import { t } from "@/lib/i18n/translate";

export const metadata: Metadata = {
  title: t("registration.simple.metaTitle"),
  description: t("registration.simple.metaDescription"),
};

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
