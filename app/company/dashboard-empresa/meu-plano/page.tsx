import { redirect } from "next/navigation";

export default function MeuPlanoRedirectPage() {
  redirect("/company/dashboard-empresa?tab=meu-plano");
}
