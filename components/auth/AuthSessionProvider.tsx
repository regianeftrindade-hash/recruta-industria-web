"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/** Sessão NextAuth — use só em layouts que precisam (login, profissional, empresa). */
export default function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
