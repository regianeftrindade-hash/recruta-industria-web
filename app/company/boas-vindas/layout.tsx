import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boas-vindas",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
