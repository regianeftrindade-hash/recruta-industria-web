import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { resolveInterfaceLocale } from "@/lib/i18n/resolve-interface-locale";
import { t } from "@/lib/i18n/translate";
import { LOCALE_COOKIE, localeCookieOptions } from "@/lib/i18n/locale-cookie";
import { readLocaleChoice } from "@/lib/i18n/locale-preference";
import { writeSessionLocale } from "@/lib/i18n/session-locale";
import type { SupportedLocale } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function saveAccountLocale(locale: SupportedLocale): Promise<void> {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase().trim();
    if (!email) return;
    await prisma.user.update({
      where: { email },
      data: { locale },
    });
  } catch (error) {
    console.error("[i18n] Não gravei o idioma na conta:", error);
  }
}

export async function POST(request: NextRequest) {
  let currentLocale: SupportedLocale = "pt-BR";
  try {
    currentLocale = await resolveInterfaceLocale();
  } catch (error) {
    console.error("[i18n] Falha ao ler o idioma atual:", error);
  }

  const body = await request.json().catch(() => null);
  const parsed = readLocaleChoice(body, request.nextUrl.searchParams.get("locale"));
  if (!parsed.ok) {
    const message = parsed.error === "region"
      ? t("locale.unchangedRegion", currentLocale)
      : t("locale.invalid", currentLocale);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await saveAccountLocale(parsed.locale);

  const response = NextResponse.json({
    ok: true,
    locale: parsed.locale,
    message: t("locale.saved", parsed.locale),
  });
  response.cookies.set(LOCALE_COOKIE, parsed.locale, localeCookieOptions());
  await writeSessionLocale(request, response, parsed.locale);
  return response;
}
