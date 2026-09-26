"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

/** Home precisa de SessionProvider para o signIn Google/credenciais (igual ao layout do login). */
export default function HomeAuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
