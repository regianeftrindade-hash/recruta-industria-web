import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Convite de equipe",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
