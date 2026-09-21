import type { Metadata } from "next";
import AuthSessionProvider from "@/components/auth/AuthSessionProvider";

export const metadata: Metadata = {
  title: "Login",
};

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
