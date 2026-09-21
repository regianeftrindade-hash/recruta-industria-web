"use client";

import AuthSessionProvider from "@/components/auth/AuthSessionProvider";

export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
