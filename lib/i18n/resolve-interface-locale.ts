import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { selectInterfaceLocale } from "@/lib/i18n/interface-locale";
import type { SupportedLocale } from "@/lib/i18n/locales";
import { LOCALE_COOKIE } from "@/lib/i18n/locale-cookie";

/** Lê conta e cookie neste pedido. Cada página servidor chama esta função. */
export async function resolveInterfaceLocale(): Promise<SupportedLocale> {
  const jar = await cookies();
  const cookieLocale = jar.get(LOCALE_COOKIE)?.value ?? null;
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return selectInterfaceLocale({
        authenticated: true,
        accountLocale: session.user.locale,
        cookieLocale,
      });
    }
  } catch (error) {
    console.error("[i18n] Falha ao ler o idioma da conta:", error);
    return selectInterfaceLocale({
      authenticated: true,
      accountReadFailed: true,
      cookieLocale,
    });
  }
  return selectInterfaceLocale({
    authenticated: false,
    cookieLocale,
  });
}
