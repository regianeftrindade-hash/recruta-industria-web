import { redirect } from "next/navigation";

export default function ContatoRedirectPage() {
  redirect("/company/dashboard-empresa?tab=contato");
}
