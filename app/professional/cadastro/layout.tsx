import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cadastro rápido",
  description:
    "Crie sua conta no Recruta Indústria com nome, CPF, e-mail, telefone e senha. Complete o perfil depois no painel.",
};

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
