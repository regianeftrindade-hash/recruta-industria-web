import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { selectInterfaceLocale } from "@/lib/i18n/interface-locale";
import type { SupportedLocale } from "@/lib/i18n/locales";
import { LOCALE_COOKIE } from "@/lib/i18n/locale-cookie";

/** Lê conta, cookie e Accept-Language neste pedido. Cada página servidor chama esta função. */
export async function resolveInterfaceLocale(): Promise<SupportedLocale> {
  let cookieLocale: string | null = null;
  let acceptLanguage: string | null = null;
  try {
    const jar = await cookies();
    const hdrs = await headers();
    cookieLocale = jar.get(LOCALE_COOKIE)?.value ?? null;
    acceptLanguage = hdrs.get("accept-language");
  } catch (error) {
    console.error("[i18n] Falha ao ler cookies/headers do pedido:", error);
  }

  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return selectInterfaceLocale({
        authenticated: true,
        accountLocale: session.user.locale,
        cookieLocale,
        acceptLanguage,
      });
    }
  } catch (error) {
    console.error("[i18n] Falha ao ler o idioma da conta:", error);
    return selectInterfaceLocale({
      authenticated: true,
      accountReadFailed: true,
      cookieLocale,
      acceptLanguage,
    });
  }
  return selectInterfaceLocale({
    authenticated: false,
    cookieLocale,
    acceptLanguage,
  });
}
