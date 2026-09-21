import { redirect } from "next/navigation";

/** A importação ficou no cadastro do profissional. */
export default function ImportarCurriculoRedirectPage() {
  redirect("/professional/register");
}
