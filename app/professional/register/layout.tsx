import { t } from "@/lib/i18n/translate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: t("registration.ui.cadastro-profissional"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
