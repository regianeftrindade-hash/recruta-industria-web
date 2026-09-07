import { redirect } from "next/navigation";

export default function ChatRedirectPage() {
  redirect("/company/dashboard-empresa?tab=equipe");
}
