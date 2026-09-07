import { redirect } from "next/navigation";

export default function BancoRedirectPage() {
  redirect("/company/dashboard-empresa?tab=banco");
}
