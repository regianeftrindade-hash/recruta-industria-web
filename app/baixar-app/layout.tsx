import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Baixar aplicativo | Recruta Indústria",
  description:
    "Instale o Recruta Indústria no celular: no Android pelo Chrome, no iPhone pelo Safari.",
  robots: { index: true, follow: true },
};

export default function BaixarAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
