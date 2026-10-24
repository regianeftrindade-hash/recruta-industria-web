"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** O formulário antigo não confirmava o gateway. A cobrança real fica em /professional/pagamento. */
export default function CheckoutPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/professional/pagamento");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3E6C8", color: "#414141" }}>
      Abrindo...
    </div>
  );
}
