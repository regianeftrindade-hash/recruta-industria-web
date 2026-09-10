import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Área profissional",
};

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
