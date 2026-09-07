import { redirect } from "next/navigation";

export default function AlertasRedirectPage() {
  redirect("/company/dashboard-empresa?tab=alertas");
}
