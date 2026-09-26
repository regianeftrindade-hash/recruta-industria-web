import { redirect } from "next/navigation";

/** Links antigos de /empresa vão para a home única. */
export default function EmpresaRedirectPage() {
  redirect("/");
}
