import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar conta",
  description:
    "Crie sua conta no Recruta Indústria com nome, e-mail e senha. Complete o perfil depois no painel.",
};

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
