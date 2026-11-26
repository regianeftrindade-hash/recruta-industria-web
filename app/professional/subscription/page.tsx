"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n/translate";

/** O estado da assinatura é lido no servidor, na página de pagamento. */
export default function SubscriptionPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/professional/pagamento");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3E6C8", color: "#414141" }}>
      {t("ui.openingSubscription")}
    </div>
  );
}
