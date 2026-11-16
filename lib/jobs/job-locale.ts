import "@/lib/i18n/active-locale.server";
import { bindLocale } from "@/lib/i18n/active-locale";
import { resolveInterfaceLocale } from "@/lib/i18n/resolve-interface-locale";

/** O salário usa o idioma da interface e a moeda gravada na vaga. */
export async function bindJobInterfaceLocale(): Promise<void> {
  bindLocale(await resolveInterfaceLocale());
}
