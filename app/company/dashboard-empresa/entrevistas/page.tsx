import { redirect } from "next/navigation";

export default function EntrevistasRedirectPage() {
  redirect("/company/dashboard-empresa?tab=entrevistas");
}
