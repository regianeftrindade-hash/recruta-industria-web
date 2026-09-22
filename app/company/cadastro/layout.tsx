import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar conta empresa",
  description:
    "Crie a conta da sua empresa no Recruta Indústria e complete o cadastro no painel.",
};

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
