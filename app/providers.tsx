"use client";

import type { ReactNode } from "react";

/** Shell leve na home — SessionProvider fica nos layouts autenticados. */
export default function Providers({ children }: { children: ReactNode }) {
  return children;
}
