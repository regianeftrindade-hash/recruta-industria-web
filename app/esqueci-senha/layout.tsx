import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Esqueci a senha",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
