"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Esta página não confirma pagamento. O Premium só aparece depois da cobrança validada. */
export default function UpgradeSuccessPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/professional/pagamento");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3E6C8", color: "#414141" }}>
      Conferindo a assinatura...
    </div>
  );
}
